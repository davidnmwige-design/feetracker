import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function getSchool(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  return user?.school ?? null
}

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schedule = await prisma.reminderSchedule.findUnique({ where: { schoolId: school.id } })
  return NextResponse.json(schedule || { enabled: false, frequency: 'weekly', dayOfWeek: 1, dayOfMonth: 1, time: '08:00' })
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = {
    enabled: Boolean(body.enabled),
    frequency: ['weekly', 'monthly'].includes(body.frequency) ? body.frequency : 'weekly',
    dayOfWeek: Math.min(6, Math.max(0, Number(body.dayOfWeek) || 1)),
    dayOfMonth: Math.min(31, Math.max(1, Number(body.dayOfMonth) || 1)),
    time: String(body.time || '08:00').slice(0, 5),
  }

  const schedule = await prisma.reminderSchedule.upsert({
    where: { schoolId: school.id },
    update: data,
    create: { schoolId: school.id, ...data },
  })
  return NextResponse.json(schedule)
}
