## Reports

### Questions & Answers

#### Why reports use the PR date, and why it matters that it’s the same as the PR list’s date filter?

- Reports used the PR date, because it is also used by the PR list `filters by`, so _"October"_ means the same thing on both pages. This is recorded as a decision.

#### How “last month” and “leap year” are handled, and why those cases have tests?

- `"Last month”` in January means December of the previous year. `“This month”` in February 2028 ends on the 29th, a leap year. They have tests because they are easy to get wrong, so the period calculation is a pure function that takes `"today"` as a parameter, like the delivery rule in Lesson 8A.

#### Why cancelled PRs are excluded from the total?

- A `cancelled` PR's ABC was never used, so financial totals show cancelled PRs separately and exclude them from the main total. That way, the report never inflates the figures with procurements that didn't happen.

#### How `totalsColumns()` makes the tables reconcile, and how you checked it against the PR list?

- Every breakdown table ends with a totals row, and those totals **must equal** the overview figures above them. If someone adds up the `Procurement Mode` table by hand, they must get the **same** total as the overview, and the **same** as the PR list filtered to that period.
