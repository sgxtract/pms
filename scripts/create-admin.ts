import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "@/server/auth/password";
import { generateTemporaryPassword } from "@/server/auth/temporary-password";
import { sql } from "@/server/db";

async function main() {
  const [existing] = await sql`
    SELECT count(*)::int AS count
    FROM users
    WHERE role = 'admin' AND is_active
  `;

  if (existing.count > 0) {
    console.error(
      "An active Admin already exists. Create other accounts from within the application.",
    );
    process.exitCode = 1;
    return;
  }

  const prompt = createInterface({ input, output });
  const employeeId = (await prompt.question("Employee ID: "))
    .trim()
    .toUpperCase();
  const fullName = (await prompt.question("Full name: "))
    .trim()
    .replace(/\s+/g, " ");
  prompt.close();

  if (!employeeId || !fullName) {
    console.error("Employee ID and full name are both required.");
    process.exitCode = 1;
    return;
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const auditDetails = JSON.stringify({
    role: "admin",
    source: "create-admin script",
  });

  // One statement, so the account and its audit entry are saved together.
  const [admin] = await sql`
    WITH new_user AS (
      INSERT INTO users (employee_id, full_name, role, password_hash, must_change_password)
      VALUES (${employeeId}, ${fullName}, 'admin', ${passwordHash}, true)
      RETURNING id, employee_id, full_name
    ),
    audit AS (
      INSERT INTO audit_logs (action, entity_type, entity_id, changes)
      SELECT 'user.create', 'user', id::text, ${auditDetails}::jsonb
      FROM new_user
    )
    SELECT * FROM new_user
  `;

  console.log(`
Admin account created.

  Employee ID:        ${admin.employeeId}
  Name:               ${admin.fullName}
  Temporary password: ${temporaryPassword}

Save this password in a password manager now. It will not be shown again.
You will be asked to choose a new password at first login.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
