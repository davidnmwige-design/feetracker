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

The build script runs `prisma db push` automatically on every Vercel deployment,
so schema migrations apply to whichever database the branch connects to.

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
