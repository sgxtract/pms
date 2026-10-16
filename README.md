## Getting started

## Staging

Staging runs the production setup (`compose.prod.yaml`) on one machine in the office network, so the PBAC can test before go-live. Testers only need a browser; all data lives in the staging machine's database.

### First-time setup

1. Copy the template and fill it in:

```bash
   cp deploy/env.example .env.staging
   openssl rand -hex 24    # paste as POSTGRES_PASSWORD
   hostname -I             # first address = this machine's IP
```

Set `SITE_ADDRESS=https://<IP>, https://localhost` and `DEFAULT_SNI=<IP>`. `.env.staging` is never committed. 2. Add the shortcut to `~/.zshrc`, then `source ~/.zshrc`:

```bash
   alias stack='docker compose -f compose.prod.yaml --env-file .env.staging'
```

3. Build, migrate, create the first Administrator, and start:

```bash
   stack build
   stack up -d db
   stack run --rm tools npx dbmate --wait --no-dump-schema up
   stack run --rm tools npx tsx --conditions=react-server scripts/create-admin.ts
   stack up -d
```

4. Copy the staging certificate and install it on each tester's PC (Windows: Local Machine → Trusted Root Certification Authorities; Firefox also needs its own import):

```bash
   stack cp caddy:/data/caddy/pki/authorities/local/root.crt ./pms-staging-root.crt
```

5. Allow web traffic in the firewall zone of the active network connection (Fedora):

```bash
   sudo firewall-cmd --get-active-zones
   sudo firewall-cmd --permanent --zone=<zone> --add-service=http --add-service=https
   sudo firewall-cmd --reload
```

Staging data is for testing only and is not carried into production.

### Staging commands

| Task                              | Command                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Status                            | `stack ps`                                                                                           |
| Logs                              | `stack logs -f app` or `stack logs -f caddy`                                                         |
| Stop, keeping data                | `stack down`                                                                                         |
| Start again                       | `stack up -d`                                                                                        |
| Network or IP changed             | Update `SITE_ADDRESS` and `DEFAULT_SNI` in `.env.staging`, then `stack up -d --force-recreate caddy` |
| After pulling new code            | `stack build`, then `stack run --rm tools npx dbmate --wait --no-dump-schema up`, then `stack up -d` |
| Start over with an empty database | `stack down -v` (deletes staging data), then first-time setup step 3                                 |

## Daily use

### One-time: start Docker at boot

```bash
sudo systemctl enable --now docker
```

All containers use `restart: unless-stopped`, so the development database and the staging stack come back by themselves after a restart, unless they were stopped with `npm run db:down` or `stack down`.

### When this computer is serving staging

```bash
cd ~/Dev/pms
hostname -I     # if the first address changed, update .env.staging (see Staging commands)
stack up -d
stack ps        # db and app (healthy), caddy running
```

### When developing

```bash
cd ~/Dev/pms
git switch main
git pull
npm install
npm run db:up
npm run db:migrate
npm run dev     # http://localhost:3000
```

Then create a branch for the work (`feat/…`, `fix/…`, `docs/…`).

### Before shutting down

- Push your work (`git push`) so your other computer has it.
- Leave the containers running; they restart at the next boot.

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Port 5432 already in use                      | Another PostgreSQL is running. Set `POSTGRES_PORT=5433` in `.env` and change the port in `DATABASE_URL` to match.           |
| "Password authentication failed"              | Check the database container is running (`docker compose ps`); you may be reaching a different PostgreSQL on the same port. |
| "relation … does not exist"                   | A migration hasn't run on this database: `npm run db:migrate` (or the staging migrate command).                             |
| New Tailwind classes have no effect           | Stale build cache: stop the dev server, `rm -rf .next`, `npm run dev`, hard refresh.                                        |
| Staging: `localhost` works, the IP doesn't    | `SITE_ADDRESS` or `DEFAULT_SNI` doesn't match the current IP; update both and recreate Caddy.                               |
| Staging: other PCs time out                   | Firewall zone (see Staging step 5), or the PCs are on a different network or guest Wi-Fi.                                   |
| Staging: certificate warning on a tester's PC | The staging root certificate isn't installed in that PC's trusted roots (or in Firefox's own list).                         |

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

### After pulling changes

```bash
npm install
npm run db:migrate
```

New code may need new packages or database changes. Both commands do nothing if there's nothing new.

Open http://localhost:3000.

### Useful commands

| Command                     | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Start the development server                        |
| `npm run build`             | Production build and type check                     |
| `npm run db:up` / `db:down` | Start / stop the database                           |
| `npm run db:migrate`        | Apply pending migrations                            |
| `npm run db:status`         | Show migration status                               |
| `npm run db:reset`          | Rebuild the development database (deletes all data) |
| `npm run admin:create`      | Create the first Admin account (runs only once)     |
| `npm test`                  | Run the automated tests                             |

### Sample data (development only)

`npm run db:seed` adds 120 sample PRs (`SAMPLE-0001` to `SAMPLE-0120`). Remove them with `npm run db:reset`, then recreate your Admin with `npm run admin:create`. Never run the seed outside development.
