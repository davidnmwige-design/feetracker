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
        return { id: String(user.id), name: user.name, email: user.email, sessionVersion: user.sessionVersion }
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
        // Initial sign-in: embed sessionVersion in token
        token.sessionVersion = (user as any).sessionVersion ?? 1
        token.userId = (user as any).id
      } else if (token.email) {
        // Subsequent requests: validate sessionVersion hasn't been incremented
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } })
          if (dbUser && dbUser.sessionVersion !== (token.sessionVersion as number)) {
            return null as any // force re-login
          }
        } catch {
          // DB error — allow request to continue rather than locking everyone out
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!token) return session
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET
})
