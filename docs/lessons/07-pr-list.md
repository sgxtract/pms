## PR List

### Questions & Answers

1. **Why the filters live in the URL, and what that gives users?**

- Filters live in the url for a several benefits.
    + Staff can `bookmark or share` filtered views. Just by sending the URL with filter will already redirect to the filtered views.
    + The browser's `Back button` will work properly, because if it does not live in the URL, when you press back, you are not sure where it will redirect.
    + `Reloading` the page will keep the filters, unlike when the filter does not live in the URL.

2. **What happens with an invalid URL value, and why that's better than an error?**

- `Invalid URLs` won't receive any kind of error, it will just be quietly ignored, it is better because even if a user have a broken bookmark, it should still show as a `working page`.

3. **How the WHERE clause is built from optional pieces, and why it's still safe?**

- Each filter adds a condition only when it's used. `postgres.js` lets us build SQL from small fragments, and every value inside them is still sent as a `safe` parameter.

4. **Why the sort order includes the ID?**

- If two PRs share the same date, their order must never change between page loads, or a PR could appear on two pages, or on none. So we sort by date, then by ID as a tie-breaker.

5. **Why % and _ are escaped in searches?**

- These two symbols are called wildcards, they are literal. If a user searches for `20%`, the `%` they typed must be treated as a literal percent sign, not as *"anything"*.

6. **What the key on the filter bar fixes?**

- The key on the filter bar fixes a subtle problem. Form fields use `defaultValue`, which React applies only when a field first appears. When you click **"Clear"**, the URL changes, but React would normally keep the existing fields with your old values still typed in. When the filter bar has a `key` based on the current filters makes React rebuilt it whenever they change, so the fields always match the URL.

7. **What seed data is for, and why it must never reach production?**

- `seed data` is only for development, it will never reach the production.
- It must never reach the production because in order to remove or delete them you need to run `npm run db:reset` that will affect everything in the database.
