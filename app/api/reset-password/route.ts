import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimitAsync, getPasswordResetLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { parseBody, resetPasswordSchema } from '@/lib/schemas'
import bcrypt from 'bcryptjs'
import { isPasswordBreached, formatBreachMessage } from '@/lib/hibp'

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(getPasswordResetLimiter(), getIdentifier(req) + ':reset-password')
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(resetPasswordSchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { token, newPassword } = parsed.data

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 })
    }

    const breachResult = await isPasswordBreached(newPassword)
    if (breachResult.breached) {
      return NextResponse.json({ error: formatBreachMessage(breachResult.count) }, { status: 400 })
    }

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } })

    if (!resetRecord || resetRecord.used || new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashed }
    })

    await prisma.passwordReset.update({
      where: { token },
      data: { used: true }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
