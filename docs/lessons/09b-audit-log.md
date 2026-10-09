## Audit Log

### Questions & Answers

1. **Why visibility is enforced in the query, and what the ?actor= tests showed?**

- The visibility is `enforced` in the query because, even if someone **tries** to edit the URL to filter by an Administrator, a Moderator or User->Secretariat query still contains _"and the actor isn't an Admin"_, so `nothing` will leak in the audit log.
- Trying to force the filter in URL using `?actor=(AdminID)` will just results to **"No activity matches these filters."**

2. **Why system events are visible only to Admins?**

- Some entries have no actor at all: failed sign-ins, and the first Admin created by the script. These events can reveal Admin details (a failed sign-in shows the Employee ID that was typed, which could be an Admin's). So only Admins see them. Moderators see entries whose actor was a Moderator or User.

3. **Why a date filter needs to know the time zone?**

- For example we filter **"October 9"**, it means it is `midnight to midnight` in **Manila**, not in UTC. In UTC, Manila's October 9 starts at 16:00 on October 8.

4. **When to extract shared code (“the second copy”), using the URL helpers and Pagination as examples?**

- Write code once for its `first use`, and when a `second place` needs the same thing, move it into one shared piece instead of copying it, because by then you know what’s really shared.

5. **Why the audit page still shows IDs for older PR creations, and why we don’t change them?**

- old audit entries are kept exactly as they were recorded, because an audit log is `only trustworthy` **if** past entries never change, and replacing old IDs with today’s names could even make them untrue.
