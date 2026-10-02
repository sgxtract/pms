## Getting started

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
