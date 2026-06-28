import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const { publicId } = await params
    const student = await prisma.student.findFirst({
      where: { publicId, schoolId: ctx.school.id },
      select: { id: true },
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const bursary = await prisma.bursary.findUnique({ where: { studentId: student.id } })
    return NextResponse.json(bursary)
  } catch (err) {
    console.error('bursary student/[publicId] GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
