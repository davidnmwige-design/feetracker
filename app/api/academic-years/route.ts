export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { parseBody, createAcademicYearSchema } from '@/lib/schemas'

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

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(createAcademicYearSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { year, isActive = false, term1Start, term1End, term2Start, term2End, term3Start, term3End } = parsed.data

  if (isActive) {
    await prisma.academicYear.updateMany({ where: { schoolId: ctx.school.id }, data: { isActive: false } })
  }

  const record = await prisma.academicYear.create({
    data: {
      schoolId: ctx.school.id,
      year,
      isActive,
      term1Start: term1Start ? new Date(term1Start) : null,
      term1End: term1End ? new Date(term1End) : null,
      term2Start: term2Start ? new Date(term2Start) : null,
      term2End: term2End ? new Date(term2End) : null,
      term3Start: term3Start ? new Date(term3Start) : null,
      term3End: term3End ? new Date(term3End) : null,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
