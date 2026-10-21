# System Overview

A single reference for the Procurement Monitoring System (PMS) as it currently stands: the technology, the architecture, the pages and who can use them, and how the main processes flow. For the database, see `docs/database.md`; for the reasons behind each decision, see `docs/decisions.md`.

**Last updated:** October 15, 2026
**Status:** all features in the original specification are built, except attachments (Phase 7). Deployment (Phase 8) is next.

---

## 1. Technology

| Layer           | Technology                                                         | Purpose                                           |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19                                  | Pages, server rendering, Server Actions           |
| Language        | TypeScript                                                         | Type checking across the whole codebase           |
| Styling         | Tailwind CSS 4, design tokens in `globals.css`                     | Light and dark themes, print styles               |
| Fonts           | Public Sans (headings), Inter (text), JetBrains Mono (identifiers) | Self-hosted through `next/font`                   |
| Database        | PostgreSQL 18 in Docker                                            | All data, with constraints and triggers           |
| Database access | postgres.js, parameterized SQL                                     | Queries safe from SQL injection                   |
| Migrations      | dbmate, plain `.sql` files                                         | Versioned database changes                        |
| Validation      | Zod                                                                | Forms, URLs, environment variables, stored JSON   |
| Passwords       | Argon2id (`@node-rs/argon2`)                                       | OWASP-recommended hashing                         |
| Tests           | Vitest                                                             | Permission matrix, report periods, delivery dates |
| Quality         | ESLint, Prettier                                                   | Zero-warning lint, consistent formatting          |
| Version control | Git and GitHub, one branch per feature, squash and merge           | Reviewable, one-commit-per-feature history        |

## 2. Architecture

```mermaid
flowchart LR
  Browser["Browser<br/>staff and public"] -->|HTTPS| Proxy["proxy.ts<br/>quick cookie check"]
  Proxy --> Pages["Pages and layouts<br/>src/app"]
  Pages --> Auth["Session and permission checks<br/>src/server/auth"]
  Pages --> Queries["Queries<br/>src/server/queries"]
  Browser -->|form submissions| Actions["Server Actions<br/>src/server/actions"]
  Actions --> Auth
  Actions --> Tx["Transactions<br/>with row locks"]
  Tx --> DB[("PostgreSQL")]
  Queries --> DB
  Actions --> Audit["Audit writer"]
  Audit --> DB
  Shared["Shared rules<br/>src/lib: permissions, validation,<br/>dates, formatting"] -.-> Pages
  Shared -.-> Actions
  Shared -.-> Browser
```

**Principles that hold everywhere:**

- **Every page and every action checks permissions on the server.** Hiding a button is convenience; the server check is the security.
- **Queries never decide permissions;** the page or action calling them does. Visibility rules that limit rows (audit log, users list, public page) are applied inside the query's `WHERE`, so hidden rows never leave the database.
- **Related writes happen in one transaction:** a change, its history entry, and its audit entry are saved together or not at all.
- **Rules shared by the browser and the server live once in `src/lib`** (permissions, password rules, form validation), so the two can't disagree.
- **Every value from a form or URL is validated;** invalid URL values are ignored rather than causing errors.

## 3. Folder structure

```
pms/
├── compose.yaml            PostgreSQL container
├── db/
│   ├── migrations/         10 dbmate migrations
│   └── seeds/              Sample PRs (development only)
├── docs/
│   ├── decisions.md        Decisions log
│   ├── database.md         Database design
│   ├── system-overview.md  This document
│   ├── known-issues.md
│   └── lessons/            Build notes, one per lesson
├── scripts/
│   └── create-admin.ts     Creates the first Administrator
├── .github/
│   └── pull_request_template.md
└── src/
    ├── app/
    │   ├── (public)/       Home, public procurement
    │   ├── (auth)/         Sign in, change password
    │   ├── (app)/          Staff pages (sign-in required)
    │   ├── api/health/     Health check
    │   └── robots.ts
    ├── components/
    │   ├── ui/             Button, Input, Table, Badge, Pagination…
    │   └── features/       Feature components (procurement, users, audit…)
    ├── lib/                Shared rules, validation, formatting, config
    ├── server/
    │   ├── auth/           Sessions, passwords, permission checks
    │   ├── actions/        Server Actions (all writes)
    │   ├── queries/        Read queries
    │   ├── audit.ts        Audit writer
    │   └── db.ts           Connection pool and transactions
    └── proxy.ts            Redirects visitors without a session cookie
```

## 4. Pages and access

| Page               | Path                  | Who can open it                                            |
| ------------------ | --------------------- | ---------------------------------------------------------- |
| Home               | `/`                   | Everyone                                                   |
| Public procurement | `/procurements`       | Everyone                                                   |
| Sign in            | `/login`              | Visitors (signed-in users are redirected to the dashboard) |
| Change password    | `/change-password`    | Signed-in users; forced after a temporary password         |
| Dashboard          | `/dashboard`          | All staff                                                  |
| Requests (PR list) | `/requests`           | All staff                                                  |
| New PR             | `/requests/new`       | Admin, Moderator, Secretariat                              |
| PR details         | `/requests/[id]`      | All staff                                                  |
| Edit PR            | `/requests/[id]/edit` | Admin, Moderator, Secretariat, TWG                         |
| Reports            | `/reports`            | All staff                                                  |
| Audit log          | `/audit-log`          | All staff (each sees their permitted scope)                |
| Users              | `/users`              | Admin, Moderator                                           |
| Add user           | `/users/new`          | Admin, Moderator                                           |
| Edit user          | `/users/[id]`         | Admin (any account), Moderator (regular users only)        |
| Settings           | `/settings`           | Admin                                                      |
| Design preview     | `/styleguide`         | All staff (development only)                               |
| Health check       | `/api/health`         | Everyone (for monitoring)                                  |

Pages a user can't access respond as "not found".

## 5. Roles and permissions

Implemented in `src/lib/permissions.ts` and verified by `src/lib/permissions.test.ts`.

| Permission                          | Admin | Moderator | Secretariat | TWG | Member |
| ----------------------------------- | :---: | :-------: | :---------: | :-: | :----: |
| View PRs and reports                |   ✓   |     ✓     |      ✓      |  ✓  |   ✓    |
| Create PR                           |   ✓   |     ✓     |      ✓      |     |        |
| Edit PR details                     |   ✓   |     ✓     |      ✓      |  ✓  |        |
| Move PR stage                       |   ✓   |     ✓     |      ✓      |  ✓  |        |
| Cancel / restore PR                 |   ✓   |     ✓     |      ✓      |  ✓  |        |
| Reopen a Completed PR               |   ✓   |     ✓     |             |     |        |
| Upload attachments (planned)        |   ✓   |     ✓     |      ✓      |  ✓  |        |
| Delete any attachment (planned)     |   ✓   |     ✓     |             |     |        |
| View and manage regular users       |   ✓   |     ✓     |             |     |        |
| Manage Admin and Moderator accounts |   ✓   |           |             |     |        |
| Manage settings                     |   ✓   |           |             |     |        |

| Visibility | Admin                               | Moderator                   | Users        |
| ---------- | ----------------------------------- | --------------------------- | ------------ |
| Users list | All accounts                        | Moderators and Users        | —            |
| Audit log  | Everything, including system events | Moderator and User activity | Own activity |

## 6. PR status groups

The dashboard, PR list, public page, and reports all use the same three groups, defined once in `prStatusGroupCondition()`.

| Group       | Definition                         |
| ----------- | ---------------------------------- |
| In progress | Status active, stage not Completed |
| Completed   | Status active, stage Completed     |
| Cancelled   | Status cancelled, at any stage     |

In progress + Completed + Cancelled = Total.

## 7. Flowcharts

### 7.1 PR lifecycle

```mermaid
stateDiagram-v2
  [*] --> InProgress: Create PR at Received
  InProgress --> InProgress: Move forward, skip, or move back with remarks
  InProgress --> Completed: Move to Completed, after confirmation
  Completed --> InProgress: Reopen, Admin or Moderator only, remarks required
  InProgress --> Cancelled: Cancel with reason
  Completed --> Cancelled: Cancel with reason
  Cancelled --> InProgress: Restore with reason, same stage as before
  Cancelled --> Completed: Restore with reason, if it was at Completed
```

A cancelled PR is frozen: it can't be edited or moved until it's restored. PRs are never deleted.

### 7.2 Procurement stages

```mermaid
flowchart LR
  S1[Received] --> S2[Pre-Procurement] --> S3[Posting] --> S4[Pre-Bid] --> S5[Opening] --> S6[Evaluation]
  S6 --> S7[Post-Qualification] --> S8[Notice of Post-Qualification] --> S9[Notice of Award] --> S10[Notice to Proceed] --> S11[Completed]
```

A PR can move forward to any later stage (skipped stages are shown in its history) or back to an earlier one with remarks. The delivery due date is the latest Notice to Proceed plus Calendar Days.

### 7.3 Moving a PR to another stage

```mermaid
flowchart TD
  A[Staff submits a stage move] --> B{Signed in, no pending password change,<br/>has pr.move_stage?}
  B -- No --> X1[Refused]
  B -- Yes --> C{Form values valid?<br/>effective time not in the future}
  C -- No --> X2[Field errors shown]
  C -- Yes --> D[Begin transaction<br/>lock the PR row]
  D --> E{PR cancelled?}
  E -- Yes --> X3[Refused: restore first]
  E -- No --> F{At Completed and user<br/>can't reopen?}
  F -- Yes --> X4[Refused: Admin or Moderator only]
  F -- No --> G{Target stage active<br/>and different?}
  G -- No --> X5[Field error]
  G -- Yes --> H{Moving back without remarks?}
  H -- Yes --> X6[Remarks required]
  H -- No --> I{Effective time earlier than<br/>the current stage time?}
  I -- Yes --> X7[Field error]
  I -- No --> J[Insert stage history<br/>Update current stage<br/>Write audit entry]
  J --> K[Commit, refresh pages]
```

### 7.4 Editing a PR

```mermaid
flowchart TD
  A[Open edit form<br/>version = updated_at] --> B[Submit changes]
  B --> C{Valid and permitted?}
  C -- No --> X1[Errors shown, values kept]
  C -- Yes --> D[Lock PR row]
  D --> E{Cancelled?}
  E -- Yes --> X2[Refused]
  E -- No --> F{Version still the same?}
  F -- No --> X3[Conflict: someone else changed it.<br/>Reload latest details]
  F -- Yes --> G{Anything changed?}
  G -- No --> H[Nothing written]
  G -- Yes --> I[Update PR, audit before-and-after values]
  I --> J[Back to PR page: Changes saved]
```

### 7.5 Signing in and sessions

```mermaid
flowchart TD
  A[Enter Employee ID and password] --> B{5 failures for this ID<br/>in the last 15 minutes?}
  B -- Yes --> X1[Locked: try later]
  B -- No --> C{ID exists and password matches?}
  C -- No --> X2[Incorrect Employee ID or password<br/>audit: auth.login_failed]
  C -- Yes --> D{Account active?}
  D -- No --> X3[Account disabled]
  D -- Yes --> E[Create session, set cookie<br/>audit: auth.login]
  E --> F{Must change password?}
  F -- Yes --> G[Change password page]
  F -- No --> H[Dashboard]
  G --> H
```

```mermaid
flowchart TD
  R[Every request] --> S{Session cookie<br/>matches a session?}
  S -- No --> L[Sign in page]
  S -- Yes --> T{Idle under 15 min,<br/>under 10 hours total,<br/>account active?}
  T -- No --> D[Delete session] --> L
  T -- Yes --> U[Refresh activity, at most once a minute] --> P[Page or action continues]
  W[Browser: no activity for 13 min] --> M[Warning with Stay signed in]
  M -- Stays --> U
  M -- 15 min reached --> TO[Signed out, audit: auth.timeout]
```

### 7.6 Account management

```mermaid
flowchart TD
  A[Admin or Moderator] --> B[Create account]
  B --> C[Temporary password shown once]
  C --> D[User signs in, must choose own password]
  A --> E[Reset password]
  E --> F[New temporary password,<br/>all sessions signed out]
  F --> D
  A --> G[Disable account]
  G --> H[All sessions signed out, cannot sign in]
  H --> I[Enable account]
  I --> J[Signs in with existing password]
```

Safeguards: Moderators manage regular users only; nobody can change their own role or disable themselves; the last active Administrator can't be demoted or disabled.

## 8. Audit actions

| Area     | Actions                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| Sign-ins | `auth.login`, `auth.logout`, `auth.timeout`, `auth.login_failed`, `auth.login_blocked`                     |
| Accounts | `user.create`, `user.update`, `user.password_change`, `user.password_reset`, `user.disable`, `user.enable` |
| PRs      | `pr.create`, `pr.update`, `pr.move_stage`, `pr.cancel`, `pr.restore`                                       |
| Settings | `settings.update`                                                                                          |

Each entry records who, their role at the time, when, from which IP address, the subject, and the changed values. Passwords are never recorded.

## 9. Dashboard, public page, and reports

| Feature            | Shows                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard          | Total, In progress, Completed, Cancelled; in-progress ABC; PRs by stage and by mode; deliveries overdue or due within 7 days; PRs in one stage over 15 days; recent activity            |
| Public procurement | PR Number, PR date, Particulars, End-User, ABC, Procurement Mode, Current stage, Status; search and filters on public columns only                                                      |
| Home               | Live In progress, Completed, Cancelled counts; the stages                                                                                                                               |
| Reports            | Period (All time, This month, Last month, This quarter, This year, Custom); Financial overview; Total ABC by Procurement Mode and by Category; A4 print with letterhead and signatories |

## 10. Automated tests

| File                            | Covers                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/permissions.test.ts`   | The full permission matrix, account management rules, audit scopes, user list visibility |
| `src/lib/delivery.test.ts`      | Delivery due date and overdue status                                                     |
| `src/lib/report-period.test.ts` | Report periods, including year boundaries and leap years                                 |

## 11. Commands

| Command                                            | Purpose                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| `npm run dev`                                      | Development server                                  |
| `npm run build`                                    | Production build and type check                     |
| `npm run lint` / `npm test`                        | Lint and tests                                      |
| `npm run db:up` / `db:down`                        | Start / stop the database                           |
| `npm run db:migrate` / `db:status` / `db:rollback` | Migrations                                          |
| `npm run db:reset`                                 | Rebuild the development database (deletes all data) |
| `npm run db:seed`                                  | Add 120 sample PRs (development only)               |
| `npm run db:psql`                                  | Database shell                                      |
| `npm run admin:create`                             | Create the first Administrator                      |

## 12. Not yet built

- **Attachments** (Phase 7): PDF, JPG, PNG up to 2.5 MB per file, with the upload and deletion rules in the permission matrix.
- **Deployment** (Phase 8): production Docker setup, Cloudflare Tunnel, restricted database account, backups, staging server, end-to-end tests, security review, User Manual, and Administrator Guide.
