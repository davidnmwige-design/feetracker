import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

async function getSchoolUser(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  return user?.school ? user : null
}

export async function GET(req: Request) {
  const user = await getSchoolUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id, user.school!)
  if (!hasPermission(role, 'reminders/schedule', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const schedule = await prisma.reminderSchedule.findUnique({ where: { schoolId: user.school!.id } })
  return NextResponse.json(schedule || { enabled: false, frequency: 'weekly', dayOfWeek: 1, dayOfMonth: 1, time: '08:00' })
}

export async function POST(req: Request) {
  const user = await getSchoolUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id, user.school!)
  if (!hasPermission(role, 'reminders/schedule', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const data = {
    enabled: Boolean(body.enabled),
    frequency: ['weekly', 'monthly'].includes(body.frequency) ? body.frequency : 'weekly',
    dayOfWeek: Math.min(6, Math.max(0, Number(body.dayOfWeek) || 1)),
    dayOfMonth: Math.min(31, Math.max(1, Number(body.dayOfMonth) || 1)),
    time: String(body.time || '08:00').slice(0, 5),
  }

  const schedule = await prisma.reminderSchedule.upsert({
    where: { schoolId: user.school!.id },
    update: data,
    create: { schoolId: user.school!.id, ...data },
  })
  return NextResponse.json(schedule)
}
