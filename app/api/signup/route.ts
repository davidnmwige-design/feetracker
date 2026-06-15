import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimitAsync, getSignupLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import zxcvbn from 'zxcvbn'
import { isPasswordBreached, formatBreachMessage } from '@/lib/hibp'
import { parseBody, signupSchema } from '@/lib/schemas'

const RESERVED_PREFIXES = ['admin', 'support', 'billing', 'noreply', 'hello']

export async function POST(req: Request) {
  console.log('[Signup] Step 1: Request received')

  // ── Rate limit ────────────────────────────────────────────────────────────────
  const rl = await checkRateLimitAsync(getSignupLimiter(), getIdentifier(req) + ':signup')
  if (!rl.success) return rateLimitResponse(rl.reset)

  // ── Parse + validate body ─────────────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const parsed = parseBody(signupSchema, rawBody)
  if (!parsed.success) {
    console.log('[Signup] Step 2: Validation failed:', parsed.error)
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { name, email, password, schoolName, term } = parsed.data
  console.log('[Signup] Step 2: Validation passed for:', email.substring(0, 3) + '***')

  // ── Password complexity ───────────────────────────────────────────────────────
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 })
  }

  const strength = zxcvbn(password)
  if (strength.score < 2) {
    return NextResponse.json({ error: 'Password is too weak. Please choose a stronger password.' }, { status: 400 })
  }

  // ── HIBP breach check ─────────────────────────────────────────────────────────
  try {
    const breachResult = await isPasswordBreached(password)
    if (breachResult.breached) {
      return NextResponse.json({ error: formatBreachMessage(breachResult.count) }, { status: 400 })
    }
    console.log('[Signup] Step 3: HIBP check passed')
  } catch (err) {
    // Non-fatal — fail open and log
    console.error('[Signup] Step 3: HIBP error (continuing):', err)
  }

  // ── Reserved prefix check ─────────────────────────────────────────────────────
  const localPart = email.split('@')[0]
  if (RESERVED_PREFIXES.includes(localPart)) {
    return NextResponse.json({ success: true })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // ── Database duplicate checks ─────────────────────────────────────────────────
  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      console.log('[Signup] Step 4: Duplicate email, returning silent success')
      return NextResponse.json({ success: true })
    }

    console.log('[Signup] Step 4: Duplicate checks passed')
  } catch (err) {
    console.error('[Signup] Step 4 FAILED — database error during duplicate check:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again in a moment.' }, { status: 503 })
  }

  // ── Hash password ─────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash(password, 10)
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // ── Create user + school ──────────────────────────────────────────────────────
  let userId: number
  try {
    console.log('[Signup] Step 5: Creating user + school...')
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        school: {
          create: {
            name: schoolName,
            currentTerm: term || 'Term 1 2026',
            trialEndsAt,
          }
        }
      },
      select: { id: true },
    })
    userId = user.id
    console.log('[Signup] Step 5: User created:', userId)
  } catch (err) {
    console.error('[Signup] Step 5 FAILED — user/school creation error:', err)
    return NextResponse.json({ error: 'Failed to create your account. Please try again.' }, { status: 500 })
  }

  // ── Admin notification email (fire-and-forget, never blocks signup) ───────────
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } }).catch(() => null)
    if (settings?.notifyNewSchool !== false) {
      const trialEnd = trialEndsAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'davidnmwige@gmail.com',
        subject: `New school signup: ${schoolName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#050f2c;padding:20px 24px">
            <h1 style="font-size:16px;margin:0;font-weight:700;letter-spacing:1px"><span style="color:#fff">ELIMU</span><span style="color:#c8a84b"> PAY</span></h1>
            <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">New school signup</p>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
            <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px">A new school has joined Elimu Pay.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">School</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${schoolName}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Admin name</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Email</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Trial ends</td><td style="padding:8px 0;font-weight:600;color:#0a1f4e;text-align:right">${trialEnd}</td></tr>
            </table>
          </div>
          <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay Platform &middot; Admin notification</p>
          </div>
        </div>`
      }).catch(err => console.error('[Signup] Step 6: notification email error (non-fatal):', err))
    }
  } catch (err) {
    console.error('[Signup] Step 6: notification setup error (non-fatal):', err)
  }

  console.log('[Signup] Step 7: Complete, returning success for user:', userId)
  return NextResponse.json({ success: true, userId })
}
