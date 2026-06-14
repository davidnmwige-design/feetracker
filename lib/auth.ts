import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          logAudit({ action: 'LOGIN_FAILURE', details: `Email: ${credentials.email}` }).catch(() => {})
          return null
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          logAudit({ userId: user.id, action: 'LOGIN_BLOCKED', details: `Account locked until ${user.lockedUntil.toISOString()}` }).catch(() => {})
          return null
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!valid) {
          const newAttempts = user.failedLoginAttempts + 1
          const lockout = newAttempts >= 10
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              lockedUntil: lockout ? new Date(Date.now() + 30 * 60 * 1000) : undefined,
            },
          }).catch(() => {})
          logAudit({ userId: user.id, action: 'LOGIN_FAILURE', details: `Email: ${user.email}, attempt ${newAttempts}${lockout ? ' — account locked' : ''}` }).catch(() => {})
          return null
        }

        // Reset lockout state on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        }).catch(() => {})

        logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', details: `Email: ${user.email}` }).catch(() => {})
        return { id: String(user.id), name: user.name, email: user.email, sessionVersion: user.sessionVersion, twoFactorEnabled: user.twoFactorEnabled }
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  session: { strategy: 'jwt', maxAge: 15 * 60 },
  jwt: { maxAge: 15 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        try {
          // Try by numeric id first; fall back to email in case id is missing/non-numeric
          // (next-auth v5 beta does not guarantee user.id is forwarded unchanged)
          let dbUser: { id: number; twoFactorEnabled: boolean; sessionVersion: number } | null = null
          const numId = Number(user.id)
          if (!isNaN(numId) && numId > 0) {
            dbUser = await prisma.user.findUnique({
              where: { id: numId },
              select: { id: true, twoFactorEnabled: true, sessionVersion: true },
            })
          }
          if (!dbUser && user.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, twoFactorEnabled: true, sessionVersion: true },
            })
            if (dbUser) token.userId = String(dbUser.id)
          }
          token.twoFactorEnabled = dbUser?.twoFactorEnabled ?? false
          token.sessionVersion = dbUser?.sessionVersion ?? 1
        } catch {
          token.twoFactorEnabled = false
          token.sessionVersion = 1
        }
      } else if (token.userId && token.sessionVersion !== undefined) {
        // On every subsequent token refresh, re-validate sessionVersion and
        // sync twoFactorEnabled so enabling/disabling 2FA takes effect without
        // requiring a full sign-out.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.userId) },
            select: { sessionVersion: true, twoFactorEnabled: true },
          })
          if (!dbUser) return { ...token, exp: 0 }
          if (dbUser.sessionVersion !== (token.sessionVersion as number)) {
            return { ...token, exp: 0 }
          }
          token.twoFactorEnabled = dbUser.twoFactorEnabled
        } catch {
          // DB error — continue with existing token rather than locking users out
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!token) return session
      return {
        ...session,
        user: {
          ...session.user,
          id: String((token as any).userId || ''),
          twoFactorEnabled: Boolean((token as any).twoFactorEnabled),
        },
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET
})
