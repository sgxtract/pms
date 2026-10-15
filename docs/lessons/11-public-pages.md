## Public Pages

### Questions & Answers

#### What data minimization means, and how the page source check proved it?

- `Data minimization` means there are lesser info that are revealed to the PR list, it also protects the other internal fields such as: _Account Code_, _Reference ID_, _Source of Funds_, and `staff names`.

#### Why public search can’t include the Reference ID, even though the search box doesn’t mention it?

- For the same reason, the public search covers only public columns. If searching a `Reference ID` returned matches, the public could learn which PRs are consolidated, even though the `Reference ID` column isn't shown.

#### Why the status groups and the home page figures reuse existing code?

- They share the same code from the `Dashboard`: **In Progress**, **Completed**, and **Cancelled**. They share the number of PR.

#### What robots.txt does, and what it doesn’t?

- `robots.txt` is a polite request, not a security. It asks search engines not to index the internal pages. It doesn't protect anything; the login does. But it keeps sign-in screens out of search results.
