## Cancel and Restore

### Questions & Answers

1. **Why cancelling is a status, separate from the stages, and how that makes “restore at the same stage” automatic?**

- Cancelling is a status, because the stage and its history aren't involved at all. When the `cancelled pr` is restore, it will return exactly where it was.

2. **What happened in the two-tab test?**

- `Tab 1` Succeeds in cancelling the PR, and `Tab 2` will receive a notifcation _"This PR is already cancelled"_.

3. **Why the buttons say “Yes, cancel PR” and “Keep PR” instead of “OK” and “Cancel”?**

- It is just for clarification, because the meaning of `Cancel` will be vague. Whether it is need to cancel the PR or cancel the form. So does for the `OK` button.

4. **Why the field’s ID is statusRemarks?**

- The move panel already has a field with the ID `remarks` on the same page, and IDs must be unique, or clicking one label could focus the other field. So instead of using `remarks` we specify it as `statusRemarks`.

5. **The branch workflow, in your own words, after you’ve finished the steps below?**

- The `branch workflow` is a better approach in adding something into the code, whether it is an: `feat/`, `fix/`, `docs/`, `refactor`, or a `chore/`. It is also necesarry to make a branch before any changes to the `main` because it won't reflect to the `main` if it was not merged.
