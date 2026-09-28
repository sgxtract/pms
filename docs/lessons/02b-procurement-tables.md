## Procurement Tables

### Questions

+ What an index is, and why we didn't index every column
+ What a transaction is, and what happened in the failed stage move
+ Why current_stage_id is stored on the PR, and what keeps it accurate
+ How append-only tables work, and their limitation
+ Why db:reset exists, and why it must never run in production

### Answers

- Index identifies the specific column so the PostgreSQL will look for the specific index to match, if it puts on every column it will just look for every indexes. It makes the database optimized for faster search and filters.
- Transaction is a way in protecting the database. Whenever there are three queries that need to change, and 2 succeeds and one change fails, then all of them will not proceed, the query will fail.
- 
- append-only tables work best for audit logs, because it cannot be edited, change, or deleted.
- `db:reset` exists to be used in development, for testing data and functions, it deletes all the data.
