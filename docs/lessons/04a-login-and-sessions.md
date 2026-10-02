## Sessions

### Questions
1. How the session works, from login to expiry, including  why the database stores a hash of the token?
2. Why the cookie survives closing the browser, and what still logs the user out?
3. The two layers of protection (proxy and server checks), and why the proxy doesn't redirect away from /login?
4. How the lockout works, and its trade-off?
5. Why every page calls requireUser(), even inside a protected layout?

### Answers

1. The session works when the user login, the server will generate a `long random token` that will be insert in a `cookie browser`. The `SHA-256` hash is the one being used in the database, if ever someone stole a copy of the database they still couldn't use those sessions because they need the `original token` that *lives* in the user's browser and **NOT** in the database.

2. The cookie is `persistent`. After closing the browser it survives for up to 15 minutes, more than it will run out the idle clock in the database, so the next request will log you out.

3. `proxy.ts` runs first before every other page and it execute a **quick and optimistic check**, if there are no cookie session available, it will be redirected to login page. A `cookie` can be stale or forged, so the real check happens on the server, in the layout and in every page and action, against the database.

4. The `lockout` reuses the audit log. Five `failed` login for the same user id or employee id within 15 minutes blocks further attempts until the oldest failure is more than 15 minutes old. The `trade-off` if someone knows an Employee-ID, it could deliberately lock that person out for 15 minutes.

5. `requireUser()` is used by every page for the reason that it can be reuse the layout without running it again, especially when you navigate between pages that share the same layout.
