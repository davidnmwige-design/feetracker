import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const VALID_ROLES = ['admin', 'accountant', 'principal', 'viewer']

function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

async function getActorAndSchool(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      school: true,
      schoolUsers: { include: { school: true }, take: 1 },
    },
  })
  if (!user) return null
  const school = user.school ?? user.schoolUsers?.[0]?.school ?? null
  if (!school) return null
  return { user, school }
}

export async function GET(req: Request) {
  const ctx = await getActorAndSchool(req)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await getUserRole(ctx.user.id, ctx.school)
  if (!hasPermission(role, 'team', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const members = await prisma.schoolUser.findMany({
    where: { schoolId: ctx.school.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(members)
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:      'Full access — manage students, upload statements, send invoices, manage team',
  accountant: 'Can upload bank statements, send reminders and invoices',
  principal:  'Can view the dashboard, student records and reports',
  viewer:     'Read-only access to the dashboard',
}

export async function POST(req: Request) {
  const ctx = await getActorAndSchool(req)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rolePost = await getUserRole(ctx.user.id, ctx.school)
  if (!hasPermission(rolePost, 'team', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const name = sanitize(body.name || '', 120)
  const email = sanitize(body.email || '', 254).toLowerCase()
  const role = VALID_ROLES.includes(body.role) ? body.role : 'viewer'

  if (!name || name.length > 120) return NextResponse.json({ error: 'Name must be between 1 and 120 characters' }, { status: 400 })
  if (!email || email.length > 254) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })

  // Check if user already exists
  let targetUser = await prisma.user.findUnique({ where: { email } })
  const isNewUser = !targetUser
  let tempPassword: string | null = null

  if (isNewUser) {
    tempPassword = crypto.randomBytes(8).toString('hex')
    const hashed = await bcrypt.hash(tempPassword, 10)
    targetUser = await prisma.user.create({
      data: { name, email, password: hashed, twoFactorEnabled: false },
    })
  }

  // Check if already in this school
  const existing = await prisma.schoolUser.findFirst({
    where: { schoolId: ctx.school.id, userId: targetUser!.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'This person is already a team member' }, { status: 400 })
  }

  const member = await prisma.schoolUser.create({
    data: { schoolId: ctx.school.id, userId: targetUser!.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://elimupay.co.ke'}/login`
  const inviterName = ctx.user.name || 'The school admin'
  const roleDesc = ROLE_DESCRIPTIONS[role] || role

  const credentialsBlock = isNewUser && tempPassword
    ? `<div style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:600">Your login details</p>
        <p style="margin:0 0 6px;font-size:13px;color:#0f172a"><strong>Email:</strong> ${email}</p>
        <p style="margin:0;font-size:13px;color:#0f172a"><strong>Temporary password:</strong> <code style="background:#f1f5f9;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:14px;letter-spacing:1px">${tempPassword}</code></p>
      </div>
      <p style="color:#dc2626;font-size:13px;margin:0 0 20px;font-weight:600">Please sign in and change your password immediately.</p>`
    : `<p style="color:#64748b;font-size:13px;margin:0 0 20px">Sign in with your existing Elimu Pay account using <strong>${email}</strong>.</p>`

  const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
    <div style="background:#0a1f4e;padding:24px 32px;text-align:center">
      <h1 style="margin:0;font-family:Georgia,serif;font-size:24px"><span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span></h1>
      <p style="color:#94a3c8;margin:8px 0 0;font-size:12px">School Fee Management</p>
    </div>
    <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
      <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px">You have been invited to ${ctx.school.name}</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 20px">
        Hi ${name},<br><br>
        <strong>${inviterName}</strong> has invited you to join <strong>${ctx.school.name}</strong> on Elimu Pay.
      </p>
      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:16px 20px;margin:0 0 20px">
        <p style="margin:0 0 4px;font-size:13px;color:#475569"><strong>Your role:</strong> <span style="text-transform:capitalize;color:#0a1f4e;font-weight:700">${role}</span></p>
        <p style="margin:0;font-size:13px;color:#64748b">${roleDesc}</p>
      </div>
      ${credentialsBlock}
      <a href="${loginUrl}" style="display:block;text-align:center;background:#0a1f4e;color:#fff;padding:14px 24px;border-radius:6px;font-size:14px;font-weight:700;text-decoration:none">Sign in to Elimu Pay</a>
    </div>
    <div style="padding:16px;background:#f8f9fc;text-align:center;border:1px solid #e2e8f0;border-top:none">
      <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
    </div>
  </div>`

  // Try to send email but don't block the response on failure
  let emailSent = false
  try {
    await sendEmail({ to: email, subject: `You have been invited to join ${ctx.school.name} on Elimu Pay`, html: emailHtml })
    emailSent = true
  } catch (err) {
    console.error('team invite email error:', err)
  }

  return NextResponse.json({
    ...member,
    tempPassword: isNewUser ? tempPassword : null,
    isNewUser,
    emailSent,
  })
}

export async function DELETE(req: Request) {
  const ctx = await getActorAndSchool(req)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roleDel = await getUserRole(ctx.user.id, ctx.school)
  if (!hasPermission(roleDel, 'team', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  await prisma.schoolUser.deleteMany({ where: { id: Number(memberId), schoolId: ctx.school.id } })
  return NextResponse.json({ success: true })
}
