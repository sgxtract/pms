# Procurement Monitoring System - Decisions Log

This document records the agreed decisions for the Procurement Monitoring System (PMS): what was decided and why. It is the reference for development and for client presentations. When a decision changes, update the entry and note the date. Do not delete old reasoning.

**Last updated:** September 27, 2026

---

## 1. Technology

| ID | Decision | Reason |
|---|---|---|
| D-001 | Next.js, React, TypeScript, Tailwind CSS | Modern full-stack framework; type safety reduces bugs; widely known, so the system is easy to hand over to other developers. |
| D-002 | PostgreSQL 18 | Reliable, free, handles millions of rows; transactions keep stage changes and history consistent. |
| D-003 | PostgreSQL runs in Docker (Docker Compose) | Same database version for every developer and every server; one-command setup. |
| D-004 | Migrations are plain `.sql` files in `db/migrations/`, managed with dbmate | Readable by anyone who knows SQL; the full history of database changes is version-controlled. |
| D-005 | Queries use the `postgres` (postgres.js) driver with parameterized SQL; input validated with Zod | Parameterized queries prevent SQL injection; validation rejects bad data before it reaches the database. |
| D-006 | Money is stored as `NUMERIC(15,2)` | Exact decimal values; floating-point numbers cause rounding errors in totals. |
| D-007 | All timestamps stored as `timestamptz`; server time zone `Asia/Manila` | Correct times for stage history and reports. |
| D-008 | Git and GitHub, with Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) | Readable history; changelogs can be generated for the client. |

## 2. Design

| ID | Decision |
|---|---|
| D-010 | Fonts: **Public Sans** for headings, **Inter** for UI and body text, **JetBrains Mono** for identifiers (PR Number, Reference ID, Account Code). All fonts self-hosted through `next/font`. |
| D-011 | Theme: deep civic navy primary with brighter blue for interactive elements, on slate neutrals. |
| D-012 | Light and dark mode toggle. Dark mode uses slate-950, not pure black. |
| D-013 | Status colours always appear with a text label, never colour alone. |
| D-014 | Buttons are compact and minimal. Tables are paginated. |

## 3. Roles and permissions

### 3.1 Roles

- **Administrator:** full system access. Currently one Admin (the developer); more can be added later.
- **Moderator:** operational access plus management of regular User accounts. Intended for the PBAC Head, the Governor, and the Governor's administrative staff.
- **User:** operational access according to User Type: PBAC Secretariat, PBAC TWG, or PBAC Member.

Admin and Moderator accounts have no User Type. A regular User must have one.

### 3.2 Permission matrix

| Action | Admin | Moderator | Secretariat | TWG | Member |
|---|:-:|:-:|:-:|:-:|:-:|
| View PRs | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create PR | ✓ | ✓ | ✓ | — | — |
| Edit PR details | ✓ | ✓ | ✓ | ✓ | — |
| Move PR stage | ✓ | ✓ | ✓ | ✓ | — |
| Cancel / restore PR | ✓ | ✓ | ✓ | ✓ | — |
| Upload attachment | ✓ | ✓ | ✓ | ✓ | — |
| Delete own attachment | ✓ | ✓ | ✓ | ✓ | — |
| Delete any attachment | ✓ | ✓ | — | — | — |
| View reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage regular User accounts | ✓ | ✓ | — | — | — |
| Manage Admin / Moderator accounts | ✓ | — | — | — | — |
| View audit logs | All | All except Admin actions | Own only | Own only | Own only |

### 3.3 Account rules

- No public registration. Accounts are created only by an Admin, or by a Moderator for regular Users.
- A Moderator cannot create Admin or Moderator accounts, or promote a User to either role.
- Accounts are **disabled, never deleted**. A disabled user cannot log in.
- An Admin cannot disable their own account. The last active Admin cannot be disabled.
- Employee ID is unique.

### 3.4 Passwords

- Minimum 8 characters, with at least one uppercase letter, lowercase letter, number, and special character.
- Users can change their own password; this requires the current password.
- Admins and Moderators can reset passwords for accounts they are allowed to manage.
- Passwords are hashed with Argon2id.
- Changing a password or disabling an account signs that user out of all sessions.

## 4. Sessions

| ID | Decision |
|---|---|
| D-030 | Sessions are stored in the database; the browser holds an httpOnly, secure cookie that survives closing the browser. |
| D-031 | **Idle timeout: 15 minutes.** A warning modal appears at 13 minutes with a "Stay signed in" option. |
| D-032 | Absolute session lifetime of about 10 hours (one workday). *Default, to be confirmed.* |
| D-033 | Logged-in users visiting the login page are redirected to the dashboard. Visitors who are not logged in can access only the Home page and the Public Procurement page. |
| D-034 | Permissions are checked on the server for every action and query, not only at route level. |

## 5. Procurement Requests

### 5.1 Fields

| Field | Required | Notes |
|---|:-:|---|
| PR Number | ✓ | Stored as text (e.g. `2026091252`, `2026091231-A`). Entered by the creator. Unique; trimmed and converted to uppercase before saving. |
| PR Date | ✓ | |
| Reference ID | — | See 5.2. |
| Type of PR | — | Goods, Medicines, Infrastructure, Services. |
| End-User | ✓ | Free text with autocomplete from previously entered values. |
| Particulars / Project Name | ✓ | |
| ABC | ✓ | `NUMERIC(15,2)`. |
| Source of Funds | ✓ | Free text with autocomplete. |
| Procurement Mode | — | See 5.3. |
| Calendar Days | — | See 5.6. |
| Account Code | ✓ | Free text with autocomplete. |

All fields remain editable while the PR is active. Every edit is audited with before and after values.

### 5.2 Reference ID

- Used when several PRs are consolidated into one procurement.
- One Reference ID can cover many PRs; a PR has at most one Reference ID.
- Stored in its own table. Free text (a common format is `GO-26-09-097`, but it varies). Unique.
- **PRs under the same Reference ID are always moved through stages individually.** There is no bulk stage change.

### 5.3 Procurement Modes and Stages

- Both are database lookup tables with a display order, so they can be added or changed without code changes.
- Current modes: Competitive Bidding, Small Value Procurement, Negotiated Procurement. A fourth mode may be added later.
- Current stages (11): Received, Pre-Procurement, Posting, Pre-Bid, Opening, Evaluation, Post-Qualification, Notice of Post-Qualification, Notice of Award, Notice to Proceed, Completed.
- Stages and modes are never deleted, only deactivated, because historical records refer to them.

### 5.4 Status

- A PR's status is **Active** or **Cancelled**.
- "Completed" is a stage, not a status. The dashboard reports Completed PRs as active PRs at the Completed stage.

### 5.5 Stage movement

- A PR can move **forward to any later stage**; skipped stages are visible in the history.
- A PR can move **back to an earlier stage**, but a remark is required.
- Remarks are optional for forward moves.
- Each stage change records:
  - **Effective time:** when it actually happened, entered by staff.
  - **Recorded time:** when it was encoded, set by the system.
  - The user who made the change, and the remarks.
- Validation: the effective time cannot be in the future, and cannot be earlier than the effective time of the PR's latest stage entry.
- The current stage is also stored on the PR itself for fast searching; it is updated in the same transaction as the history record.

### 5.6 Calendar Days

- Calendar Days is the delivery period given to the winning supplier, counted from the Notice to Proceed.
- **Delivery due date** = effective date of the Notice to Proceed + Calendar Days.
- The dashboard shows deliveries that are due soon or overdue: PRs that have reached Notice to Proceed but not Completed.

### 5.7 Cancel and restore

- Secretariat, TWG, Moderators, and Admins can cancel and restore PRs, with a remark stating the reason.
- A cancelled PR is **frozen**: it cannot be edited or moved until restored.
- Restoring a PR does not change its current stage.
- PRs are **never deleted**. Encoding mistakes are fixed by editing an active PR, or the PR is cancelled with a remark such as "encoding error".

## 6. Attachments

- Allowed types: PDF, JPG, PNG. Maximum size: 2.5 MB per file.
- Upload: Admin, Moderator, Secretariat, TWG.
- Delete: Admins and Moderators can delete any attachment; Secretariat and TWG can delete only their own uploads.
- Deletion hides the file rather than destroying it, and is audited.
- The database table is designed now; the feature is built in a later phase.

## 7. Audit

- Important administrative and procurement actions are audited: logins, account changes, PR creation and edits (with before and after values), stage changes, cancel and restore, and attachment uploads and deletions.
- Stage history is kept permanently and remains after a PR moves on.
- Every record stores created by, created at, updated by, and updated at.
- Visibility follows section 3.2.

## 8. Search, filter, and dashboard

- **Keyword search:** PR Number, Reference ID, Particulars, End-User.
- **Filters:** Status, Stage, Procurement Mode, Type of PR, Source of Funds, End-User, PR Date range, ABC range.
- Filters are stored in the page URL, so filtered views can be bookmarked and shared.
- **Dashboard:** Total, Active, Completed, and Cancelled counts; total ABC of active PRs; PRs per stage; PRs by Procurement Mode (count and ABC); PRs staying too long in one stage; deliveries due or overdue; recent activity.

## 9. Public Procurement page

- Columns: PR Number, PR Date, Particulars, ABC, Procurement Mode, End-User, Current Stage, Status.
- Cancelled PRs are shown with their status, for transparency.

## 10. Reports

- **Period filters:** All time, This Month, Last Month, This Quarter, This Year, Custom Date Range.
- **Views:** Financial Overview, Total ABC by Procurement Mode.
- **Printing:** A4, with LGU letterhead and logo, and "Prepared by" and "Noted by" signatory lines.
- Signatory names and positions are editable in system settings.

## 11. Hosting and deployment

| ID | Decision | Reason |
|---|---|---|
| D-110 | The whole system runs as one Docker Compose stack: Next.js app, PostgreSQL, backups, and Cloudflare Tunnel. | The same setup runs on an LGU-owned server or a cloud VPS; moving between them needs no code changes. |
| D-111 | Public access through **Cloudflare Tunnel** (free plan), for DNS, HTTPS, and attack protection. | No public IP or open firewall ports needed, which suits LGU networks. |
| D-112 | Fallback if the tunnel is not allowed: a VPS with a public IP, using Caddy for automatic HTTPS. | Keeps the system independent of Cloudflare if required. |
| D-113 | The app runs on the standard Node.js runtime, not an edge runtime. | Full library support; keeps every hosting option open. |
| D-114 | Attachments are stored on the server's disk (a Docker volume), behind a storage module that can later be switched to S3-compatible storage. | Simple now; flexible later. |
| D-115 | Backups: nightly database dump plus attachments; copies kept off the server; a restore is tested monthly. | Protects government records; an untested backup is not a backup. |
| D-116 | A staging deployment is set up after Phase 3 (authentication). | Deployment is practised before the production launch. |
| D-117 | Audit logs record the user's real IP address using the `CF-Connecting-IP` header. | Behind Cloudflare, the ordinary request IP is Cloudflare's. |

Suggested server: current Ubuntu LTS, 2 vCPU, 2–4 GB RAM, 50 GB disk.

## 12. Scope and scale

- About 10–12 users in total.
- No import of existing PRs; the system is used for new PRs only.
- Scalability concerns data growth over years, which PostgreSQL handles with proper indexes, including `pg_trgm` for text search.

## 13. Open items

| Item | Owner | Status |
|---|---|---|
| Fourth Procurement Mode | PBAC | To be named |
| Hosting target: LGU server or cloud VPS | LGU IT office / PBAC | To decide before Phase 8 |
| Domain name (e.g. a subdomain of the LGU's gov.ph domain) | LGU IT office | To request |
| Disclosure of Cloudflare Tunnel to the Data Protection Officer | Developer | Before production |
| Hosting subscription procurement, if a VPS is chosen | PBAC | Before production |
| Absolute session lifetime (default: 10 hours) | PBAC | To confirm |
