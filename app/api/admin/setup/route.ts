import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimitAsync, getAuthLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import bcrypt from 'bcryptjs'
import { parseBody, adminSetupSchema } from '@/lib/schemas'

export async function GET() {
  const adminCount = await prisma.user.count({ where: { isAdmin: true } })
  return NextResponse.json({ setupComplete: adminCount >= 1 })
}

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(getAuthLimiter(), getIdentifier(req) + ':admin-setup')
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } })
    if (adminCount >= 1) {
      return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    }

    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Setup failed' }, { status: 403 }) }
    const parsed = parseBody(adminSetupSchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: 'Setup failed' }, { status: 403 })
    const { name, email, password, secretKey } = parsed.data

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
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
