## Creating Purchased Requests

### Questions & Answers

1. **What's saved when a PR is created, and why it happens in one transaction?**

- A PR is saved together with its first stage history entry `"Received"`, its `Reference ID` if it has one, and its audit entry.

2. **The difference between effective_at and recorded_at, using the example of a PR encoded late?**

- The `effective_at` is when the PBAC received it, and the `recorded_at` is when it was actually recorded to the system.

3. **How free-text values are kept consistent?**

- It is kept consistent when someone types on the `End-User` field for example: `general services office` and `General Services Office` already exists, the existing spelling is used. It will prevent the capitalization of words problem without forcing anyone to pick from a list.

4. **How the Reference ID race is handled by ON CONFLICT DO NOTHING?**

- If two users create the same new **Reference ID** at the same moment, the second `INSERT` quietly does nothing, and its `SELECT` finds the row the first one created. Resulting to both PRs end up linked to the same **Reference ID**.

5. **Why ABC is never converted to a JavaScript number for storage?**

- ABC is never converted to a JavaScript number for storage so that there will be no rounding can ever creep in.

6. **Why each field shows its own error, and where the focus goes?**

- The `focus` moves to the first invalid field after a failed submit, so keyboard and screen reader users don't have to search for the problem.
