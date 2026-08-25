# JustInfluence

A full-stack influencer marketing platform MVP. Agencies create campaigns, invite influencers by
email, and see verified Instagram analytics pulled through [Phyllo (InsightIQ)](https://insightiq.ai).

- **Backend** — Node.js + Express + PostgreSQL (`/server`)
- **Frontend** — React + Vite (`/client`)

## What it does

| Flow | Description |
| --- | --- |
| Agency signup / login | JWT auth, bcrypt password hashing |
| Campaigns | Create, list, view detail, delete |
| Influencer invites | Agency generates a magic link; influencer sets a password and gets a Phyllo user |
| Instagram connect | Influencer links their account through the Phyllo Linkage SDK |
| Analytics | Phyllo webhooks push profile / audience / content data, cached in `influencer_analytics` |
| Discovery | Search public creator data through Phyllo's public API |

## Setup

### 1. Requirements

- Node.js 18+
- PostgreSQL 14+ (the schema uses `gen_random_uuid()` from `pgcrypto`)
- A Phyllo sandbox account for a real Instagram connection (optional — see *Running without Phyllo*)

### 2. Install dependencies

From the repository root (npm workspaces installs both `server` and `client`):

```bash
npm install
```

### 3. Create the database

```bash
createdb justinfluence
```

### 4. Configure environment variables

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:

```
PORT=4000
DATABASE_URL=postgresql://localhost:5432/justinfluence
JWT_SECRET=change_me_to_a_long_random_string
PHYLLO_CLIENT_ID=your_phyllo_sandbox_client_id
PHYLLO_SECRET=your_phyllo_sandbox_secret
PHYLLO_ENV=sandbox
PHYLLO_BASE_URL=https://api.sandbox.insightiq.ai
PHYLLO_WEBHOOK_SECRET=your_phyllo_webhook_secret
FRONTEND_URL=http://localhost:5173
```

`PHYLLO_WEBHOOK_SECRET` is optional. When it's set, incoming webhooks must carry a valid
`x-phyllo-signature` HMAC or they're rejected with a 401.

### 5. Run migrations

```bash
npm run db:migrate
```

This applies `server/schema.sql`. It is idempotent, so it's safe to re-run.

### 6. Start the dev servers

In two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Vite proxies `/api` to the backend, so the frontend needs no extra configuration.

## Running without Phyllo credentials

Every Phyllo call degrades gracefully — failures are logged and return `null` rather than crashing.
To exercise the full analytics UI locally without real credentials or webhooks, use the dev-only
route that marks an influencer connected and stores generated analytics:

```bash
curl -X POST http://localhost:4000/api/dev/simulate-connect/<influencerId>
```

The campaign detail page exposes this as a **Simulate connect** button on any pending influencer row.
The route is only mounted when `NODE_ENV !== 'production'`.

## Phyllo webhooks

Point your Phyllo webhook at `POST /api/webhooks/phyllo`. For local development, tunnel it:

```bash
ngrok http 4000
```

Handled events:

- `accounts.connected` — stores `phyllo_account_id`, flips `platform_connected`, then fetches analytics
- `identity.updated` / `engagement.updated` — re-fetches analytics for that account

The route responds `200` immediately and does the fetch work in `setImmediate`, so Phyllo never waits
on our API calls. Events are logged to `webhook_events` and de-duplicated by `phyllo_event_id`.

## API reference

All responses are `{ success: true, data }` or `{ success: false, error }`.

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/agency/signup` | — | Create agency, returns JWT |
| POST | `/api/auth/agency/login` | — | Returns JWT |
| GET | `/api/auth/invite/:token` | — | Validate an invite, returns inviting agency |
| POST | `/api/auth/influencer/accept-invite` | — | Set password, create Phyllo user, returns JWT |
| POST | `/api/auth/influencer/login` | — | Returns JWT |

### Campaigns (agency JWT)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/campaigns` | List campaigns with influencer counts |
| POST | `/api/campaigns` | Create a campaign |
| GET | `/api/campaigns/:id` | Campaign + roster + each influencer's latest analytics |
| DELETE | `/api/campaigns/:id` | Delete a campaign |

### Influencers

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/influencers/invite` | agency | Create invite token, returns the shareable link |
| POST | `/api/influencers/sdk-token` | influencer | Phyllo SDK token for the Linkage flow |
| GET | `/api/influencers/me` | influencer | Own profile + campaigns |

### Analytics (agency JWT)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/analytics/overview` | Agency-wide totals for the dashboard |
| GET | `/api/analytics/influencer/:id` | Latest analytics snapshot |
| GET | `/api/analytics/campaign/:id` | Aggregated reach and engagement |

### Discovery

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/discovery/search` | `?q=&platform=&minFollowers=&maxFollowers=&minEngagement=` |

## Routes (frontend)

| Path | Page |
| --- | --- |
| `/` | Landing |
| `/signup` | Agency signup |
| `/login` | Login (agency or influencer) |
| `/join?token=…` | Influencer invite acceptance + Instagram connect |
| `/dashboard` | Agency dashboard (protected) |
| `/campaigns/:id` | Campaign detail + analytics (protected) |
| `/discovery` | Public creator search (protected) |
| `/influencer/home` | Influencer home (protected) |

JWTs are stored in `localStorage`; protected routes redirect to `/login` when absent.

## Notes

- The campaign detail page polls every 30 seconds so newly connected influencers appear without a reload.
- Analytics are stored as append-only snapshots; queries read the most recent row per influencer.
- Discovery data is public and not account-verified — the UI labels this explicitly.
