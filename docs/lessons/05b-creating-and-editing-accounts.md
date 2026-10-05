## Creating and Editing Accounts

### Questions and Answers

1. **Why the server re-checks everything the form sends, and what happened in the tamper experiment?**

- The server **must check** every value again, as if the form didn't exist.

- `Tamper Experiment` successfully refused the user trying to bypass the admin role using *dev tools*.

2. **What a race condition is, and how FOR UPDATE prevents the "no Admins left" case?**

- Race condition is when 2 authorized or admin tries to demote their account at the same time that will result to more Admin account left.

- `FOR UPDATE` prevents the **"no Admins left"** case, because they can't edit or make a transaction if there is currently an on-going transaction, the other must wait and see the results first before the user can edit it.

3. **Why locks are always taken in the same order?**

- If every transaction takes its locks in the same order, nobody can end up waiting while holding something another transaction needs, so no two transactions can block each other forever.

4. **How a named constraint becomes a friendly error message?**

- Because the message is translated to a more friendly message such as: "This Employee ID is already in use."

- This happens when a user create an account with an Employee ID that is already taken.

5. **Why these forms submit through onSubmit instead of the action attribute?**

- `onSubmit` is to prevent the retyping of every details you already entered when there is only 1 field that has an error or that failed during submission.

- The details that was already entered will not be cleared.
