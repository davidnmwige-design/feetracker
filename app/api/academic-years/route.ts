import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const years = await prisma.academicYear.findMany({
    where: { schoolId: ctx.school.id },
    orderBy: { year: 'desc' },
  })
  return NextResponse.json(years)
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const year = parseInt(body.year)
  if (!year || year < 2000 || year > 2100) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })

  const isActive = body.isActive === true

  if (isActive) {
    await prisma.academicYear.updateMany({ where: { schoolId: ctx.school.id }, data: { isActive: false } })
  }

  const record = await prisma.academicYear.create({
    data: {
      schoolId: ctx.school.id,
      year,
      isActive,
      term1Start: body.term1Start ? new Date(body.term1Start) : null,
      term1End: body.term1End ? new Date(body.term1End) : null,
      term2Start: body.term2Start ? new Date(body.term2Start) : null,
      term2End: body.term2End ? new Date(body.term2End) : null,
      term3Start: body.term3Start ? new Date(body.term3Start) : null,
      term3End: body.term3End ? new Date(body.term3End) : null,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
