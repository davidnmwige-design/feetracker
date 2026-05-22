import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { parseBody, reminderScheduleSchema } from '@/lib/schemas'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'reminders/schedule', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const schedule = await prisma.reminderSchedule.findUnique({ where: { schoolId: ctx.school.id } })
  return NextResponse.json(schedule || { enabled: false, frequency: 'weekly', dayOfWeek: 1, dayOfMonth: 1, time: '08:00' })
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'reminders/schedule', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(reminderScheduleSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const data = {
    enabled: parsed.data.enabled,
    frequency: parsed.data.frequency ?? 'weekly',
    dayOfWeek: parsed.data.dayOfWeek ?? 1,
    dayOfMonth: parsed.data.dayOfMonth ?? 1,
    time: parsed.data.time ?? '08:00',
  }

  const schedule = await prisma.reminderSchedule.upsert({
    where: { schoolId: ctx.school.id },
    update: data,
    create: { schoolId: ctx.school.id, ...data },
  })
  return NextResponse.json(schedule)
}
