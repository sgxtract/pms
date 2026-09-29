import { randomInt } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { passwordSchema } from "@/lib/validation/password";
import { hashPassword } from "@/server/auth/password";
import { sql } from "@/server/db";

const CHARACTER_SETS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*?-_+=",
];

function generateTemporaryPassword(length = 16): string {
  const allCharacters = CHARACTER_SETS.join("");

  // One character from each set guarantees the password policy is met.
  const characters = CHARACTER_SETS.map((set) => set[randomInt(set.length)]);
  while (characters.length < length) {
    characters.push(allCharacters[randomInt(allCharacters.length)]);
  }

  // Shuffle so the guaranteed characters aren't always at the start.
  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }

  return characters.join("");
}

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
  passwordSchema.parse(temporaryPassword);
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
