import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    if (!user?.school) return NextResponse.json([])

    // Scope unmatched payments to this school
    const payments = await prisma.payment.findMany({
      where: {
        matched: false,
        schoolId: user.school.id,
      },
      orderBy: { paidAt: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (err) {
    console.error('unmatched GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    if (!user?.school) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    const body = await req.json()
    const paymentId = Number(body.paymentId)
    const studentId = Number(body.studentId)

    // Verify the payment belongs to this school before updating
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment || existingPayment.schoolId !== user.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the student belongs to this school
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student || student.schoolId !== user.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { studentId, matched: true }
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('unmatched POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
