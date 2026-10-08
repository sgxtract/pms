## Getting started

### Troubleshooting

- **Port 5432 is already in use:** another PostgreSQL is running on this computer. Set `POSTGRES_PORT=5433` in `.env` and change the port in `DATABASE_URL` to match.
- **"Password authentication failed":** first check that the database container is running (`docker compose ps`). If it isn't, you may be connecting to a different PostgreSQL on the same port.

### Requirements

- Node.js 24 or newer (LTS)
- Docker with Docker Compose
- Git

### Setup

```bash
npm install
cp .env.example .env        # then set the passwords
npm run db:up
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

### Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build and type check |
| `npm run db:up` / `db:down` | Start / stop the database |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:status` | Show migration status |
| `npm run db:reset` | Rebuild the development database (deletes all data) |
| `npm run admin:create` | Create the first Admin account (runs only once) |
| `npm test` | Run the automated tests |

### Sample data (development only)

`npm run db:seed` adds 120 sample PRs (`SAMPLE-0001` to `SAMPLE-0120`). Remove them with `npm run db:reset`, then recreate your Admin with `npm run admin:create`. Never run the seed outside development.