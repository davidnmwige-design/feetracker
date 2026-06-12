import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json([])

    if (!hasPermission(ctx.role, 'unmatched', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const payments = await prisma.payment.findMany({
      where: { matched: false, schoolId: ctx.school.id },
      orderBy: { paidAt: 'desc' },
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
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'unmatched', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const paymentId = Number(body.paymentId)
    const studentId = Number(body.studentId)

    const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!existingPayment || existingPayment.schoolId !== ctx.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student || student.schoolId !== ctx.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { studentId, matched: true, matchConfidence: 'manual' },
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('unmatched POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

/**
 * Splits a multiple-student payment into individual matched payments.
 * Validates that split amounts sum to the original total before committing.
 * The original payment is deleted and replaced with per-student records.
 */
export async function PUT(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'unmatched', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const paymentId = Number(body.paymentId)
    const splits = body.splits as Array<{ studentId: number; amount: number }>

    if (!Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: 'splits array is required' }, { status: 400 })
    }

    const originalPayment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!originalPayment || originalPayment.schoolId !== ctx.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate split total equals original amount (allow 1 KES rounding tolerance)
    const splitTotal = splits.reduce((sum, s) => sum + Number(s.amount), 0)
    if (Math.abs(splitTotal - originalPayment.amount) > 1) {
      return NextResponse.json(
        { error: `Split amounts (${splitTotal}) must equal original payment (${originalPayment.amount})` },
        { status: 400 }
      )
    }

    // Verify all students belong to this school
    const studentIds = splits.map(s => Number(s.studentId))
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId: ctx.school.id },
    })
    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: 'One or more students not found' }, { status: 400 })
    }

    // Atomic transaction: delete original, create individual matched payments
    await prisma.$transaction([
      prisma.payment.delete({ where: { id: paymentId } }),
      ...splits.map((split, idx) =>
        prisma.payment.create({
          data: {
            mpesaRef: originalPayment.mpesaRef ? `${originalPayment.mpesaRef}_split${idx + 1}` : null,
            amount: Number(split.amount),
            paidAt: originalPayment.paidAt,
            senderName: originalPayment.senderName,
            matched: true,
            studentId: Number(split.studentId),
            schoolId: ctx.school.id,
            source: 'upload',
            matchConfidence: 'manual',
            paymentType: 'split',
            originalDescription: originalPayment.originalDescription,
          },
        })
      ),
    ])

    return NextResponse.json({ success: true, splitCount: splits.length })
  } catch (err) {
    console.error('unmatched PUT error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
