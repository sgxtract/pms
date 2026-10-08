"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { manilaInputToDate } from "@/lib/dates";
import {
  PR_FORM_FIELDS,
  prFormSchema,
  type PrFormField,
} from "@/lib/validation/procurement-request";
import { writeAuditLog } from "@/server/audit";
import { getActionUser } from "@/server/auth/authorize";
import { isUniqueViolation, transaction, type Db } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";

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
