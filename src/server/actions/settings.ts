"use server";

import { revalidatePath } from "next/cache";
import {
  EMPTY_SIGNATORIES,
  SIGNATORY_FIELDS,
  signatoriesFormSchema,
  storedSignatoriesSchema,
  toSignatoriesForm,
  toStoredSignatories,
} from "@/lib/validation/settings";
import { diffFields, writeAuditLog } from "@/server/audit";
import { getActionUser } from "@/server/auth/authorize";
import { transaction } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";

export type SettingsState =
  { status: "error"; message: string } | { status: "saved" } | undefined;

export async function updateReportSignatories(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getActionUser("settings.manage");
  if (!user)
    return {
      status: "error",
      message: "You don't have permission to change settings.",
    };

  const parsed = signatoriesFormSchema.safeParse(
    Object.fromEntries(
      SIGNATORY_FIELDS.map((field) => [
        field,
        String(formData.get(field) ?? ""),
      ]),
    ),
  );
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const form = parsed.data;
  const meta = await getRequestMeta();

  await transaction(async (tx) => {
    const [row] = await tx<{ value: unknown }[]>`
      SELECT value FROM system_settings
      WHERE key = 'report_signatories'
      FOR UPDATE
    `;
    const current = storedSignatoriesSchema.safeParse(row?.value);
    const before = toSignatoriesForm(
      current.success ? current.data : EMPTY_SIGNATORIES,
    );

    const changes = diffFields(before, form, SIGNATORY_FIELDS);
    if (Object.keys(changes).length === 0) return;

    await tx`
      INSERT INTO system_settings (key, value, updated_by)
      VALUES ('report_signatories', ${tx.json(toStoredSignatories(form))}, ${user.id})
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by
    `;

    await writeAuditLog(
      {
        actor: { id: user.id, role: user.role },
        action: "settings.update",
        entityType: "setting",
        entityId: "report_signatories",
        changes,
        meta,
      },
      tx,
    );
  });

  revalidatePath("/settings");
  revalidatePath("/reports");
  return { status: "saved" };
}
