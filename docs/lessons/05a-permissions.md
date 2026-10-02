## Permissions

### Questions & Answers

1. **Why permissions live in one file, and why that file can be shared with the browser?**

- It is a better way to implement it rather than having permission checks on different pages, sooner or later one page gets it wrong and nobody notices. Instead, every page and action asks one function: `can(user, "pr.create")`.

- The `permission file` lives in `src/lib/`, not `src/server/`. It runs on lib, but the `enforcement` is still always on the server.

2. **The difference between hiding (convenience) and enforcing (security).**

- A `PBAC Member` shouldn't see a **"Create PR"** button. This is `convenience`, not security: anyone can type a URL or send a request directly, but it will get rejected if you are on the wrong user.

- On the `server`, to actually refuse. Every page and action checks before doing anything. This is the `security`.

3. **What the permission tests check, and what happened when you broke a rule?**

- The `permission tests` check and compare what the code does against the agreed conditions, question by question. When you `broke` a rule, the test `caught` exactly that one mismatch.

4. **Why dates are formatted with a fixed time zone?**

- Fixed `timeZone` is essential. Without it, a date would be formatted in the server's time zone on the server, then in the browser's time zone in the browser. If they differ, then it will *report a mismatch*, and a time near midnight could even show a different day. But, with fixed `timeZone`, both will always agree.

5. **Why query functions never decide permissions?**

- Query functions never decide permissions, because the one who will do it is the page or action that calls them must check permission first. The query functions `only` fetch data.
