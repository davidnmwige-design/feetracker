# Elimu Pay Deployment Guide

## Environments

| Environment | URL | Branch | Database |
|---|---|---|---|
| **Production** | https://feetracker-seven.vercel.app | `main` | Neon `main` branch |
| **Staging** | Vercel preview URL (auto-assigned) | `staging` | Neon `staging` branch |

## Deployment Process

1. Create a feature branch from `main`:
   ```
   git checkout -b feature/my-feature
   ```
2. Make and commit changes
3. Merge into `staging` and push — Vercel auto-deploys a preview
4. Test on the staging preview URL
5. If all tests pass, open a PR from feature branch → `main`
6. Merge to `main` — Vercel auto-deploys to production

## Environment Variables

See `.env.example` for all required variables.

For staging, copy `.env.staging` values into Vercel → Project Settings → Environment Variables
and scope them to the **Preview** environment only.

Staging overrides:
- `NEXT_PUBLIC_IS_STAGING=true` — shows the red staging banner
- `DARAJA_ENV=sandbox` — uses Safaricom sandbox API
- `DATABASE_URL` — must point to a separate Neon staging branch

## Database

**Production:** Neon `main` branch  
**Staging:** Create a Neon branch at neon.tech → your project → Branches → New Branch

### Migrations

The build script runs `prisma migrate deploy` on every Vercel deployment (it replaced the
previous `prisma db push --accept-data-loss`, which could silently drop columns/data). Migrations
live in `prisma/migrations/` and are applied in order.

**Day-to-day workflow:** when you change `prisma/schema.prisma`, create a migration locally with
`npx prisma migrate dev --name <change>` and commit the generated folder. The next deploy applies it
automatically. Never edit a migration that has already been deployed.

**⚠️ ONE-TIME BASELINE (required before the first deploy with the new build script).**
Production and staging were previously built with `db push`, so their `_prisma_migrations` history
does not match the migration files. Before deploying, mark the existing migrations as already applied
so `migrate deploy` does not try to recreate existing tables. Run **once per environment**, against
that environment's `DATABASE_URL`:

```
npx prisma migrate resolve --applied 20260504055443_init
npx prisma migrate resolve --applied 20260504063856_add_terms
npx prisma migrate resolve --applied 20260504124803_add_admin
npx prisma migrate resolve --applied 20260611134330_catchup_full_schema
npx prisma migrate status   # should print "Database schema is up to date!"
```

If you skip this step, the deploy fails safely (it aborts before `next build`; no data is lost and the
previous version stays live) with an "already exists" error — that is the signal to run the baseline.

**⚠️ Before the `add_paybill_unique` migration deploys:** it adds a unique index on `School.paybill`,
which fails if two schools currently share a paybill (e.g. leftover QA/test schools). Remove duplicate
paybills first — `SELECT paybill, count(*) FROM "School" WHERE paybill IS NOT NULL GROUP BY paybill
HAVING count(*) > 1;` — then deploy. (NULL paybills are fine; many are allowed.)

### Connection pooling (recommended for serverless)

On Vercel each serverless invocation opens its own Postgres connection. Under load this can exhaust
the database connection limit (queries start failing with "too many connections"). To avoid this, run
the app through a pooled connection and keep migrations on a direct connection:

1. The datasource already declares `directUrl = env("DIRECT_URL")`, so **`DIRECT_URL` is required** in
   every environment (already set in CI and locally).
2. In Vercel env vars: set `DATABASE_URL` to Neon's **pooled** connection string (the host with
   `-pooler`) and `DIRECT_URL` to Neon's **direct** connection string. A missing `DIRECT_URL` fails the
   deploy safely (the build aborts), like the migration baseline.

Alternatively, use [Prisma Accelerate](https://www.prisma.io/accelerate) for managed pooling. Until one
of these is configured, keep an eye on the Neon connection-count metric as schools onboard.

## Health Monitoring

- Health check endpoint: `/api/health`
- Status page: `/status`
- Set up UptimeRobot at uptimerobot.com to monitor `/api/health` every 5 minutes
- Add `davidnmwige@gmail.com` as alert email

## Scheduled Jobs (Vercel Cron)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/reminders` | `0 8 * * *` | Daily fee reminders at 8am |
| `/api/cron/backup` | `0 6 * * *` | Daily data backup at 6am |

Crons only run in production (Vercel ignores them on preview deployments).
