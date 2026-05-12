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

async function requireSchoolAdmin(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  return user?.school ? user : null
}

export async function GET(req: Request) {
  const user = await requireSchoolAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await getUserRole(user.id, user.school!)
  if (!hasPermission(role, 'team', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const members = await prisma.schoolUser.findMany({
    where: { schoolId: user.school!.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const owner = await requireSchoolAdmin(req)
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rolePost = await getUserRole(owner.id, owner.school!)
  if (!hasPermission(rolePost, 'team', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const name = sanitize(body.name || '', 100)
  const email = sanitize(body.email || '', 200).toLowerCase()
  const role = VALID_ROLES.includes(body.role) ? body.role : 'viewer'

  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const tempPassword = crypto.randomBytes(8).toString('hex')
  const hashed = await bcrypt.hash(tempPassword, 10)

  let targetUser = await prisma.user.findUnique({ where: { email } })
  if (!targetUser) {
    targetUser = await prisma.user.create({ data: { name, email, password: hashed } })
  }

  const existing = await prisma.schoolUser.findFirst({ where: { schoolId: owner.school!.id, userId: targetUser.id } })
  if (existing) return NextResponse.json({ error: 'This user is already a team member' }, { status: 400 })

  const member = await prisma.schoolUser.create({
    data: { schoolId: owner.school!.id, userId: targetUser.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker.co.ke'}/login`
  sendEmail({
    to: email,
    subject: `You've been invited to join ${owner.school!.name} on FeeTracker`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${owner.school!.name}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">You've been invited</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">
          Dear ${name},<br>you have been invited to join <strong>${owner.school!.name}</strong> on FeeTracker as a <strong>${role}</strong>.
        </p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">Your login details:</p>
          <p style="margin:0 0 4px;font-size:13px"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;font-size:13px"><strong>Temporary password:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${tempPassword}</code></p>
        </div>
        <p style="color:#64748b;font-size:13px;margin-bottom:20px">Please sign in and change your password immediately.</p>
        <a href="${loginUrl}" style="display:block;text-align:center;background:#0a1f4e;color:#fff;padding:12px;border-radius:6px;font-size:14px;font-weight:700;text-decoration:none">Sign in to FeeTracker</a>
      </div>
    </div>`,
  }).catch(err => console.error('team invite email error:', err))

  return NextResponse.json(member)
}

export async function DELETE(req: Request) {
  const owner = await requireSchoolAdmin(req)
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roleDel = await getUserRole(owner.id, owner.school!)
  if (!hasPermission(roleDel, 'team', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const { memberId } = await req.json()
  await prisma.schoolUser.deleteMany({ where: { id: Number(memberId), schoolId: owner.school!.id } })
  return NextResponse.json({ success: true })
}
