import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })
    if (!user?.school) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: user.school.id },
      include: {
        payments: { orderBy: { paidAt: 'desc' } },
        school: true,
      }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    return NextResponse.json(student)
  } catch (err) {
    console.error('students/[id] GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })
    if (!user?.school) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: user.school.id }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const body = await req.json()
    const data: Record<string, string | null> = {}

    if ('parentEmail' in body) {
      data.parentEmail = sanitize(body.parentEmail || '', 200).toLowerCase() || null
    }
    if ('parentName' in body) {
      data.parentName = sanitize(body.parentName || '', 200) || null
    }
    if ('parentPhone' in body) {
      data.parentPhone = sanitize(body.parentPhone || '', 50) || null
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('students/[id] PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
