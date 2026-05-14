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

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!valid) {
          logAudit({ userId: user.id, action: 'LOGIN_FAILURE', details: `Email: ${user.email}` }).catch(() => {})
          return null
        }

        logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', details: `Email: ${user.email}` }).catch(() => {})
        return { id: String(user.id), name: user.name, email: user.email, sessionVersion: user.sessionVersion, twoFactorEnabled: user.twoFactorEnabled }
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  jwt: { maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sessionVersion = (user as any).sessionVersion ?? 1
        token.userId = (user as any).id
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false
      } else if (token.email && token.sessionVersion !== undefined) {
        // Only validate sessionVersion for tokens that already carry it.
        // Old tokens without sessionVersion are allowed through for backwards
        // compatibility — they will naturally expire within 24 hours.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { sessionVersion: true },
          })
          if (dbUser && dbUser.sessionVersion !== (token.sessionVersion as number)) {
            // Force expiry by back-dating exp — NextAuth treats this as unauthenticated
            return { ...token, exp: 0 }
          }
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
