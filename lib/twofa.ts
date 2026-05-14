import { createHmac, timingSafeEqual } from 'crypto'

export const COOKIE_NAME = 'ft_2fa'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function create2faCookieValue(userId: number, secret: string): string {
  const exp = Date.now() + MAX_AGE_MS
  const data = `${userId}:${exp}`
  const sig = sign(data, secret)
  return `${data}:${sig}`
}

export function verify2faCookie(value: string | undefined, userId: number, secret: string): boolean {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const [uid, exp, sig] = parts
  if (Number(uid) !== userId) return false
  if (Date.now() > Number(exp)) return false
  const data = `${uid}:${exp}`
  const expected = sign(data, secret)
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
