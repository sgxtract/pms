# Docker

_Docker is a lightweight container, it has the exact version of your database software that you won't need to install every configuration and upgrade database locally_

`compose.yaml`
+ It helps you launch the entire development stack with just one single command
>docker compose up

`.env`
+ It contains the sensitive data or keys that we will be using in creating our database.

`.env.example`
+ It contains the same keys with the `.env` but without the real values, only placeholder values so that the developer will know what variables they need.

### The daily commands
The daily commands that we are going to use with Docker are:
- `npm run db:up`
- `npm run db:down`
- `npm run db:logs`
- `docker compose down -v`

It **starts**, **stop and remove the container**, **watch the database logs** & **stop and delete all data** respectively.
