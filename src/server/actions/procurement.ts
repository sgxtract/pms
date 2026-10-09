"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { manilaInputToDate } from "@/lib/dates";
import {
  PR_EDIT_FIELDS,
  PR_FORM_FIELDS,
  prEditSchema,
  prFormSchema,
  type PrEditField,
  type PrFormField,
} from "@/lib/validation/procurement-request";
import { diffFields, writeAuditLog } from "@/server/audit";
import { getActionUser } from "@/server/auth/authorize";
import { isUniqueViolation, transaction, type Db } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";
import { formatDateTime } from "@/lib/format";
import {
  moveStageSchema,
  MOVE_STAGE_FIELDS,
  type MoveStageField,
} from "@/lib/validation/stage-move";
import { can } from "@/lib/permissions";
import { statusChangeSchema } from "@/lib/validation/status-change";

export type CreatePrState =
  | { error: string; fieldErrors?: Partial<Record<PrFormField, string>> }
  | undefined;

type LookupTable = "pr_types" | "pr_categories" | "procurement_modes";
type FreeTextColumn = "end_user" | "source_of_funds" | "account_code";

async function isActiveOption(
  tx: Db,
  table: LookupTable,
  id: string | null,
): Promise<boolean> {
  if (id === null) return true;
  const [row] = await tx`
    SELECT 1 FROM ${tx(table)} WHERE id::text = ${id} AND is_active
  `;
  return Boolean(row);
}

// The option's name if it may be used: active, or the PR's current value.
// Returns undefined if not allowed, null if no option was chosen.
async function allowedOptionName(
  tx: Db,
  table: LookupTable,
  id: string | null,
  currentId: string | null,
): Promise<string | null | undefined> {
  if (id === null) return null;
  const [row] = await tx<{ name: string }[]>`
    SELECT name FROM ${tx(table)}
    WHERE id::text = ${id} AND (is_active OR id::text = ${currentId ?? ""})
  `;
  return row?.name;
}

// If the value already exists with different capitalization,
// reuse the existing spelling.
async function matchExistingSpelling(
  tx: Db,
  column: FreeTextColumn,
  value: string,
): Promise<string> {
  const [row] = await tx`
    SELECT ${tx(column)} AS value
    FROM procurement_requests
    WHERE lower(${tx(column)}) = lower(${value})
    ORDER BY created_at
    LIMIT 1
  `;
  return row?.value ?? value;
}

async function findOrCreateReference(
  tx: Db,
  code: string,
  userId: string,
): Promise<{ id: string; created: boolean }> {
  const [inserted] = await tx`
    INSERT INTO pr_references (reference_code, created_by, updated_by)
    VALUES (${code}, ${userId}, ${userId})
    ON CONFLICT (reference_code) DO NOTHING
    RETURNING id
  `;
  if (inserted) return { id: inserted.id, created: true };

  const [existing] = await tx`
    SELECT id FROM pr_references WHERE reference_code = ${code}
  `;
  return { id: existing.id, created: false };
}

export async function createProcurementRequest(
  _previousState: CreatePrState,
  formData: FormData,
): Promise<CreatePrState> {
  const user = await getActionUser("pr.create");
  if (!user) return { error: "You don't have permission to create PRs." };

  const input = Object.fromEntries(
    PR_FORM_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  const parsed = prFormSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<PrFormField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as PrFormField;
      fieldErrors[field] ??= issue.message;
    }
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const receivedAt = manilaInputToDate(data.receivedAt);
  const meta = await getRequestMeta();

  let prId: string;
  try {
    const result = await transaction(
      async (tx): Promise<{ id: string } | { error: string }> => {
        const optionsAreValid =
          (await isActiveOption(tx, "pr_categories", data.prCategoryId)) &&
          (await isActiveOption(tx, "pr_types", data.prTypeId)) &&
          (await isActiveOption(
            tx,
            "procurement_modes",
            data.procurementModeId,
          ));
        if (!optionsAreValid) {
          return {
            error:
              "One of the selected options is no longer available. Reload the page and try again.",
          };
        }

        const endUser = await matchExistingSpelling(
          tx,
          "end_user",
          data.endUser,
        );
        const sourceOfFunds = await matchExistingSpelling(
          tx,
          "source_of_funds",
          data.sourceOfFunds,
        );
        const accountCode = await matchExistingSpelling(
          tx,
          "account_code",
          data.accountCode,
        );

        const reference = data.referenceCode
          ? await findOrCreateReference(tx, data.referenceCode, user.id)
          : null;

        const [receivedStage] = await tx`
          SELECT id FROM procurement_stages WHERE code = 'received'
        `;

        const [pr] = await tx`
          INSERT INTO procurement_requests (
            pr_number, pr_date, reference_id, pr_type_id, pr_category_id,
            end_user, particulars, abc, source_of_funds, procurement_mode_id,
            calendar_days, account_code, current_stage_id, current_stage_at,
            created_by, updated_by
          ) VALUES (
            ${data.prNumber}, ${data.prDate}, ${reference?.id ?? null},
            ${data.prTypeId}, ${data.prCategoryId},
            ${endUser}, ${data.particulars}, ${data.abc}, ${sourceOfFunds},
            ${data.procurementModeId}, ${data.calendarDays}, ${accountCode},
            ${receivedStage.id}, ${receivedAt},
            ${user.id}, ${user.id}
          )
          RETURNING id
        `;

        await tx`
          INSERT INTO pr_stage_history
            (pr_id, to_stage_id, effective_at, recorded_by, remarks)
          VALUES
            (${pr.id}, ${receivedStage.id}, ${receivedAt}, ${user.id}, ${data.remarks})
        `;

        await writeAuditLog(
          {
            actor: { id: user.id, role: user.role },
            action: "pr.create",
            entityType: "procurement_request",
            entityId: pr.id,
            changes: {
              prNumber: data.prNumber,
              prDate: data.prDate,
              referenceCode: data.referenceCode,
              referenceCreated: reference?.created ?? false,
              prTypeId: data.prTypeId,
              prCategoryId: data.prCategoryId,
              endUser,
              particulars: data.particulars,
              abc: data.abc,
              sourceOfFunds,
              procurementModeId: data.procurementModeId,
              calendarDays: data.calendarDays,
              accountCode,
              receivedAt: receivedAt.toISOString(),
            },
            meta,
          },
          tx,
        );

        return { id: pr.id };
      },
    );

    if ("error" in result) return { error: result.error };
    prId = result.id;
  } catch (error) {
    if (isUniqueViolation(error, "procurement_requests_pr_number_key")) {
      return {
        error: "Please correct the highlighted fields.",
        fieldErrors: { prNumber: `PR Number ${data.prNumber} already exists.` },
      };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  redirect(`/requests/${prId}`);
}

export type MoveStageState =
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<MoveStageField, string>>;
    }
  | { status: "moved"; toStage: string }
  | undefined;

type LockedPr = {
  id: string;
  status: "active" | "cancelled";
  currentStageId: number;
  currentStageCode: string;
  currentStage: string;
  currentSortOrder: number;
  currentStageAt: Date;
};

type TargetStage = { id: number; name: string; sortOrder: number };

const fieldError = (
  field: MoveStageField,
  message: string,
): MoveStageState => ({
  status: "error",
  message: "Please correct the highlighted fields.",
  fieldErrors: { [field]: message },
});

export async function movePrStage(
  _previousState: MoveStageState,
  formData: FormData,
): Promise<MoveStageState> {
  const user = await getActionUser("pr.move_stage");
  if (!user) {
    return {
      status: "error",
      message: "You don't have permission to move PRs.",
    };
  }

  const input = Object.fromEntries(
    MOVE_STAGE_FIELDS.map((field) => [
      field,
      String(formData.get(field) ?? ""),
    ]),
  );
  const parsed = moveStageSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<MoveStageField, string>> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as MoveStageField] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const effectiveAt = manilaInputToDate(data.effectiveAt);
  const meta = await getRequestMeta();

  const result = await transaction(async (tx): Promise<MoveStageState> => {
    // Lock only the PR row, so simultaneous moves happen one at a time.
    const [pr] = await tx<LockedPr[]>`
      SELECT p.id, p.status, p.current_stage_id, s.code AS current_stage_code,
             s.name AS current_stage, s.sort_order AS current_sort_order,
             p.current_stage_at
      FROM procurement_requests p
      JOIN procurement_stages s ON s.id = p.current_stage_id
      WHERE p.id = ${data.prId}
      FOR UPDATE OF p
    `;

    if (!pr) return { status: "error", message: "This PR could not be found." };
    if (pr.status === "cancelled") {
      return {
        status: "error",
        message:
          "This PR is cancelled. Restore it before moving it to another stage.",
      };
    }
    if (pr.currentStageCode === "completed" && !can(user, "pr.reopen")) {
      return {
        status: "error",
        message:
          "Only an Administrator or Moderator can reopen a completed PR.",
      };
    }

    const [target] = await tx<TargetStage[]>`
      SELECT id, name, sort_order
      FROM procurement_stages
      WHERE id::text = ${data.toStageId} AND is_active
    `;

    if (!target) return fieldError("toStageId", "Choose an available stage.");
    if (target.id === pr.currentStageId) {
      return fieldError("toStageId", `The PR is already at ${target.name}.`);
    }

    const movingBack = target.sortOrder < pr.currentSortOrder;
    if (movingBack && !data.remarks) {
      return fieldError(
        "remarks",
        "Explain why the PR is moving back to an earlier stage.",
      );
    }

    if (effectiveAt < pr.currentStageAt) {
      return fieldError(
        "effectiveAt",
        `This can't be earlier than the latest stage entry (${formatDateTime(pr.currentStageAt)}).`,
      );
    }

    await tx`
      INSERT INTO pr_stage_history
        (pr_id, from_stage_id, to_stage_id, effective_at, recorded_by, remarks)
      VALUES
        (${pr.id}, ${pr.currentStageId}, ${target.id}, ${effectiveAt}, ${user.id}, ${data.remarks})
    `;

    await tx`
      UPDATE procurement_requests
      SET current_stage_id = ${target.id},
          current_stage_at = ${effectiveAt},
          updated_by = ${user.id}
      WHERE id = ${pr.id}
    `;

    await writeAuditLog(
      {
        actor: { id: user.id, role: user.role },
        action: "pr.move_stage",
        entityType: "procurement_request",
        entityId: pr.id,
        changes: {
          stage: { from: pr.currentStage, to: target.name },
          effectiveAt: effectiveAt.toISOString(),
          movedBack: movingBack,
          ...(data.remarks ? { remarks: data.remarks } : {}),
        },
        meta,
      },
      tx,
    );

    return { status: "moved", toStage: target.name };
  });

  if (result?.status === "moved") {
    revalidatePath(`/requests/${data.prId}`);
    revalidatePath("/requests");
    revalidatePath("/dashboard");
  }
  return result;
}

export type UpdatePrState =
  | {
      status: "error";
      message: string;
      conflict?: boolean;
      fieldErrors?: Partial<Record<PrEditField, string>>;
    }
  | undefined;

type EditablePr = {
  id: string;
  status: "active" | "cancelled";
  version: string;
  prNumber: string;
  prDate: string;
  referenceCode: string | null;
  prTypeId: string | null;
  prType: string | null;
  prCategoryId: string;
  category: string;
  endUser: string;
  particulars: string;
  abc: string;
  sourceOfFunds: string;
  procurementModeId: string | null;
  procurementMode: string | null;
  calendarDays: number | null;
  accountCode: string;
};

export async function updateProcurementRequest(
  _previousState: UpdatePrState,
  formData: FormData,
): Promise<UpdatePrState> {
  const user = await getActionUser("pr.update");
  if (!user) {
    return {
      status: "error",
      message: "You don't have permission to edit PRs.",
    };
  }

  const input = Object.fromEntries(
    PR_EDIT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  const parsed = prEditSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<PrEditField, string>> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as PrEditField] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const meta = await getRequestMeta();

  try {
    const result = await transaction(async (tx): Promise<UpdatePrState> => {
      const [pr] = await tx<EditablePr[]>`
        SELECT p.id, p.status, p.updated_at::text AS version,
               p.pr_number, p.pr_date::text AS pr_date, r.reference_code,
               p.pr_type_id::text AS pr_type_id, t.name AS pr_type,
               p.pr_category_id::text AS pr_category_id, c.name AS category,
               p.end_user, p.particulars, p.abc, p.source_of_funds,
               p.procurement_mode_id::text AS procurement_mode_id,
               m.name AS procurement_mode, p.calendar_days, p.account_code
        FROM procurement_requests p
        LEFT JOIN pr_references r ON r.id = p.reference_id
        LEFT JOIN pr_types t ON t.id = p.pr_type_id
        JOIN pr_categories c ON c.id = p.pr_category_id
        LEFT JOIN procurement_modes m ON m.id = p.procurement_mode_id
        WHERE p.id = ${data.prId}
        FOR UPDATE OF p
      `;

      if (!pr)
        return { status: "error", message: "This PR could not be found." };
      if (pr.status === "cancelled") {
        return {
          status: "error",
          message:
            "This PR is cancelled. Restore it before editing its details.",
        };
      }
      if (pr.version !== data.version) {
        return {
          status: "error",
          conflict: true,
          message:
            "Someone else changed this PR after you opened it. Reload to see the latest details, then make your changes again.",
        };
      }

      const prType = await allowedOptionName(
        tx,
        "pr_types",
        data.prTypeId,
        pr.prTypeId,
      );
      const category = await allowedOptionName(
        tx,
        "pr_categories",
        data.prCategoryId,
        pr.prCategoryId,
      );
      const procurementMode = await allowedOptionName(
        tx,
        "procurement_modes",
        data.procurementModeId,
        pr.procurementModeId,
      );
      if (prType === undefined || !category || procurementMode === undefined) {
        return {
          status: "error",
          message:
            "One of the selected options is no longer available. Reload the page and try again.",
        };
      }

      const endUser = await matchExistingSpelling(tx, "end_user", data.endUser);
      const sourceOfFunds = await matchExistingSpelling(
        tx,
        "source_of_funds",
        data.sourceOfFunds,
      );
      const accountCode = await matchExistingSpelling(
        tx,
        "account_code",
        data.accountCode,
      );

      const before: Record<string, unknown> = {
        prNumber: pr.prNumber,
        prDate: pr.prDate,
        referenceCode: pr.referenceCode,
        prType: pr.prType,
        category: pr.category,
        endUser: pr.endUser,
        particulars: pr.particulars,
        abc: pr.abc,
        sourceOfFunds: pr.sourceOfFunds,
        procurementMode: pr.procurementMode,
        calendarDays: pr.calendarDays,
        accountCode: pr.accountCode,
      };
      const after: Record<string, unknown> = {
        prNumber: data.prNumber,
        prDate: data.prDate,
        referenceCode: data.referenceCode,
        prType,
        category,
        endUser,
        particulars: data.particulars,
        abc: data.abc,
        sourceOfFunds,
        procurementMode,
        calendarDays: data.calendarDays,
        accountCode,
      };

      const changes = diffFields(before, after, Object.keys(after));
      if (Object.keys(changes).length === 0) return undefined;

      const reference = data.referenceCode
        ? await findOrCreateReference(tx, data.referenceCode, user.id)
        : null;

      await tx`
        UPDATE procurement_requests
        SET pr_number = ${data.prNumber},
            pr_date = ${data.prDate},
            reference_id = ${reference?.id ?? null},
            pr_type_id = ${data.prTypeId},
            pr_category_id = ${data.prCategoryId},
            end_user = ${endUser},
            particulars = ${data.particulars},
            abc = ${data.abc},
            source_of_funds = ${sourceOfFunds},
            procurement_mode_id = ${data.procurementModeId},
            calendar_days = ${data.calendarDays},
            account_code = ${accountCode},
            updated_by = ${user.id}
        WHERE id = ${pr.id}
      `;

      await writeAuditLog(
        {
          actor: { id: user.id, role: user.role },
          action: "pr.update",
          entityType: "procurement_request",
          entityId: pr.id,
          changes: reference?.created
            ? { ...changes, referenceCreated: true }
            : changes,
          meta,
        },
        tx,
      );

      return undefined;
    });

    if (result) return result;
  } catch (error) {
    if (isUniqueViolation(error, "procurement_requests_pr_number_key")) {
      return {
        status: "error",
        message: "Please correct the highlighted fields.",
        fieldErrors: { prNumber: `PR Number ${data.prNumber} already exists.` },
      };
    }
    throw error;
  }

  revalidatePath(`/requests/${data.prId}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect(`/requests/${data.prId}?saved=1`);
}

export type StatusChangeState =
  | { status: "error"; message: string; remarksError?: string }
  | { status: "changed"; newStatus: "active" | "cancelled" }
  | undefined;

export async function changePrStatus(
  _previousState: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const user = await getActionUser("pr.cancel_restore");
  if (!user) {
    return {
      status: "error",
      message: "You don't have permission to cancel or restore PRs.",
    };
  }

  const parsed = statusChangeSchema.safeParse({
    prId: String(formData.get("prId") ?? ""),
    intent: formData.get("intent"),
    remarks: String(formData.get("remarks") ?? ""),
  });

  if (!parsed.success) {
    const remarksIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "remarks",
    );
    return {
      status: "error",
      message: remarksIssue
        ? "Please add your remarks."
        : "Reload the page and try again.",
      remarksError: remarksIssue?.message,
    };
  }

  const { prId, intent, remarks } = parsed.data;
  const newStatus = intent === "cancel" ? "cancelled" : "active";
  const meta = await getRequestMeta();

  const result = await transaction(async (tx): Promise<StatusChangeState> => {
    const [pr] = await tx<{ id: string; status: "active" | "cancelled" }[]>`
      SELECT id, status FROM procurement_requests
      WHERE id = ${prId}
      FOR UPDATE
    `;

    if (!pr) return { status: "error", message: "This PR could not be found." };
    if (pr.status === newStatus) {
      return {
        status: "error",
        message:
          newStatus === "cancelled"
            ? "This PR is already cancelled."
            : "This PR is already active.",
      };
    }

    await tx`
      UPDATE procurement_requests
      SET status = ${newStatus}, updated_by = ${user.id}
      WHERE id = ${pr.id}
    `;

    await tx`
      INSERT INTO pr_status_history (pr_id, action, remarks, acted_by)
      VALUES (
        ${pr.id},
        ${newStatus === "cancelled" ? "cancelled" : "restored"},
        ${remarks},
        ${user.id}
      )
    `;

    await writeAuditLog(
      {
        actor: { id: user.id, role: user.role },
        action: intent === "cancel" ? "pr.cancel" : "pr.restore",
        entityType: "procurement_request",
        entityId: pr.id,
        changes: { status: { from: pr.status, to: newStatus }, remarks },
        meta,
      },
      tx,
    );

    return { status: "changed", newStatus };
  });

  if (result?.status === "changed") {
    revalidatePath(`/requests/${prId}`);
    revalidatePath("/requests");
    revalidatePath("/dashboard");
  }
  return result;
}
