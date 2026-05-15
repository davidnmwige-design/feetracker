import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ payments: [], fetchedAt: new Date().toISOString() })

    const payments = await prisma.payment.findMany({
      where: { student: { schoolId: ctx.school.id } },
      take: 10,
      orderBy: { paidAt: 'desc' },
      include: { student: true },
    })

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p.id,
        mpesaRef: p.mpesaRef,
        amount: p.amount,
        paidAt: p.paidAt.toISOString(),
        senderName: p.senderName,
        senderPhone: p.senderPhone,
        matched: p.matched,
        source: p.source,
        student: p.student ? { name: p.student.name, class: p.student.class } : null,
      })),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('payments/recent error:', err)
    return NextResponse.json({ payments: [], fetchedAt: new Date().toISOString() })
  }
}
