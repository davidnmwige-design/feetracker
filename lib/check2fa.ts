import { auth } from './auth'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

    if (!ft2fa) redirect('/verify-2fa')

    const parts = ft2fa.split(':')
    if (parts.length !== 3) redirect('/verify-2fa')

    const [cookieUserId, expiry] = parts
    if (cookieUserId !== String(user.id)) redirect('/verify-2fa')
    if (Date.now() > Number(expiry)) redirect('/verify-2fa')
  }

  return user
}

export function verify2faCookieValue(ft2fa: string | undefined, userId: number): boolean {
  if (!ft2fa) return false
  const parts = ft2fa.split(':')
  if (parts.length !== 3) return false
  const [cookieUserId, expiry] = parts
  if (cookieUserId !== String(userId)) return false
  if (Date.now() > Number(expiry)) return false
  return true
}
