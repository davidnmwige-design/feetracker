import { secureEqual } from './secureCompare'

/**
 * Authorizes a Vercel cron (or manual) request to a `/api/cron/*` route.
 *
 * FAILS CLOSED: if `CRON_SECRET` is not configured, no request is authorized.
 * Accepts the secret via the `Authorization: Bearer <secret>` header (what Vercel
 * Cron sends), an `x-cron-secret` header, or a `?secret=` query parameter.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = req.headers.get('authorization')
  if (secureEqual(authHeader, `Bearer ${secret}`)) return true

  const headerSecret = req.headers.get('x-cron-secret')
  if (secureEqual(headerSecret, secret)) return true

  const querySecret = new URL(req.url).searchParams.get('secret')
  if (secureEqual(querySecret, secret)) return true

  return false
}
