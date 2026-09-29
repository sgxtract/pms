## Database Connection

### Questions

+ What server-only protects against?
+ What a connection pool is, and why globalThis is needed in development?
+ Why environment variables are validated at startup?
+ The difference between hashing and encryption, and why Argon2id?
+ Why the first Admin comes from a script, and what stops the script from being misused?

### Answers

- `server-only` protects the server code. When the build fails it will have an clear error output.

- A `connection pool` opens a connection to the database and reuses them. `globalThis` is a trick in development, without it every save would create a new pool while the old one stays open.

- Environment variables are valdiated at the startup so it won't have a problem later if there is an invalid connections. This is called `failing fast`.

- `Hash` is a one way transformation, it can be checked if the password matches it, but you can't turn it back into a pasword.
`Encryption` on the otherhand is reversible with a key. `Argon2id` is slow and memory-hungry, so an attacker who steals the database can't try billions of guesses per second, it also add salt to hashes that when two password is the same, it gets different hashes.

- The first admin comes from the script because only the system can create the first admin and not the logged-in user. When the `DATABASE_URL` is incorrect then it will not continue it requires the assigned URL correctly. Also, the system cannot create another Admin after creating one.