import "server-only";
import { randomInt } from "node:crypto";
import { passwordSchema } from "@/lib/validation/password";

const CHARACTER_SETS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*?-_+=",
];

export function generateTemporaryPassword(length = 16): string {
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

  const password = characters.join("");
  passwordSchema.parse(password);
  return password;
}
