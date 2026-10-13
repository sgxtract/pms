## Dashboard

### Questions & Answers

#### 1. Why the dashboard’s numbers must match the PR list, and how you checked it?

- It should match the PR list so that the `dashboard` can be trusted. To check it, if the dashboard says _38 In Progress_ when you clicked it, it should match the total number of PRs as well.

#### 2. The three groups (in progress, completed, cancelled), and why they never overlap?

- It should not be overlap because they are separate category, the three groups is the `total number` of PRs when you add them.

#### 3. What FILTER and count(*) OVER () do?

- `FILTER` counts each group in a single pass over the PRs, the `count(*) OVER ()` counts all matching rows and adds that number to each returned row, even though `LIMIT` returns only 10.

#### 4. Why the delivery rule exists in two places, and what keeps them in sync?

- The rule exists in `TypeScript` for the PR page and in `SQL` for the dashboard, because the dashboard must search all PRs _inside_ the database and the _two languages_ **can’t share code**; comments pointing to each other, a manual comparison, and the written rule in the decisions log keep them in agreement.

#### 5. Why the bars are simple HTML rather than a charting library?

- Every number is written as text, and the bars are decoration on top (`aria-hidden`). Screen readers, printouts, and people who can't distringuish colours all get the full information.

- Each label is a link to the matching filtered PR list.