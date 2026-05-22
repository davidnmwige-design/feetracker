import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimitAsync, authLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import bcrypt from 'bcryptjs'

export async function GET() {
  const adminCount = await prisma.user.count({ where: { isAdmin: true } })
  return NextResponse.json({ setupComplete: adminCount >= 1 })
}

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(authLimiter, getIdentifier(req) + ':admin-setup')
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } })
    if (adminCount >= 1) {
      return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    }

    const body = await req.json()
    const name = sanitize(body.name, 100)
    const email = sanitize(body.email, 200).toLowerCase()
    const password = body.password as string
    const secretKey = body.secretKey as string

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, isAdmin: true }
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    console.error('admin setup error:', err)
    return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
  }
}
