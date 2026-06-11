import { auth } from './auth'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

const TWO_FACTOR_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''

// HMAC-SHA256 over `${userId}:${expiry}` so the ft_2fa cookie cannot be forged.
function signTwoFactor(userId: number, expiry: number): string {
  return crypto.createHmac('sha256', TWO_FACTOR_SECRET).update(`${userId}:${expiry}`).digest('hex')
}

// Signed cookie value: `${userId}:${expiry}:${hmac}`. Use this everywhere ft_2fa is set.
export function buildTwoFactorCookie(userId: number, expiry: number): string {
  return `${userId}:${expiry}:${signTwoFactor(userId, expiry)}`
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export function verify2faCookieValue(ft2fa: string | undefined, userId: number): boolean {
  if (!ft2fa) return false
  const parts = ft2fa.split(':')
  if (parts.length !== 3) return false
  const [cookieUserId, expiry, signature] = parts
  if (cookieUserId !== String(userId)) return false
  if (!/^\d+$/.test(expiry) || Date.now() > Number(expiry)) return false
  return safeEqual(signature, signTwoFactor(userId, Number(expiry)))
}

export async function require2FA() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, twoFactorEnabled: true },
  })

  if (!user) redirect('/login')

  if (user.twoFactorEnabled) {
    const cookieStore = await cookies()
    const ft2fa = cookieStore.get('ft_2fa')?.value
    if (!verify2faCookieValue(ft2fa, user.id)) redirect('/verify-2fa')
  }

  return user
}
