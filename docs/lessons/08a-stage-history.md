## Stage History

### Questions & Answers

1. **What the lost update problem is, and what happened in the two-tab test?**

- The `lost update problem` is when two staff simultaneously updated the same PR it will have two identical history entries. We prevent this by locking the PR's row at the start of the move. So in the `two-tab test`, what happened is when they both tried to update the same PR there will be a notification that the **PR is already** in that stage.

2. **Why FOR UPDATE OF p locks only the PR?**

- This is to prevent locking the matching row in both tables, including the shared stage row, which every other PR at that stage also points to. So to prevent this, `FOR UPDATE OF p` locks only the PR.

3. **How current_stage_at saves a query, and why it's safe to rely on?**

- `current_stage_at` always equals the latest history entry's time, because both are written in the same transaction, so we can read it from the PR row we already have instead of searching the history.

4. **Why getDeliveryStatus takes "now" as a parameter?**

- passing `"now"` in as a parameter lets tests use a fixed date, so they give the same result no matter when they're run, while the app still uses the real time by default.

5. **Why the default effective time is set when the panel opens?**

- Because if the page sat open for half an hour, the default is still `"now"`. It's calculated in the browser, using Manila time, inside a click handler, so it can't cause a server and browser mismatch.

6. **What the consistency query proves?**

- the query compares every PR's current stage with its latest history entry, and an empty result proves they all agree.
