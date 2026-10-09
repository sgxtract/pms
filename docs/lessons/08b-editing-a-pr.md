## Editing a PR

### Questions & Answers

1. **The difference between a row lock (Lesson 8A) and a version check (this lesson), and why editing needs the version check?**

- A `row lock` in this lesson is different in a way where the lock only lasts for the _instant of the transaction_; nobody can hold one for ten minutes.Editing **needs** the `version check` to make sure the user is editing the newer version, or the already edited version.

2. **What happened in the two-tab test, and how “Reload latest details” works?**

- During the two-tab test, when tab 1 already make changes and tab 2 is trying to edit the same PR that has already make a changed, there will be a message that says `"Someone else changed this PR after you opened it. Reload to see the latest details, then make your changes again."`. After the user pressed the `Reload latest details` button, the page will be refreshed to the newer version of the edited PR.

3. **Why the version travels as text, not as a Date?**

- `PostgreSQL` stores timestamps to the **microsecond**, but JavaScript `Date` only keeps **milliseconds**. If the version went through a `Date`, the last three digits would be lost, and the comparison would never match. In that sense, the version travels as text, straight from the database: `updated_at::text`.

4. **Why ABC values are normalized to two decimals?**

- The ABC values are normalized to two decimals so that it won't trigger the `audit logs` when a number `10000.50` changed to `10000.5`. Without normalizing it, the edited amount that removes the trailing zero will be `audited`. Also, it is also normalized to two decimals because this is also how the currency is being formatted in any sense.

5. **Why the audit log records names rather than IDs?**

- The `audit log` **records names** rather than IDs, for a better readability of a user, especially the Admin and Moderator.

6. **What refactoring means, using the shared form fields as the example?**

- Refactoring means, the `code is changed`, but it will `behave exactly as before`, and the code is now `shared`.

- Refactoring also means, reorganizing the code to be cleaner, easier to read, better performance, and works more efficiently without affecting its functionality.
