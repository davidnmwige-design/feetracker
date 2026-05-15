import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const [studentCount, paymentCount, invoiceCount] = await Promise.all([
      prisma.student.count({ where: { schoolId: ctx.school.id } }),
      prisma.payment.count({ where: { schoolId: ctx.school.id } }),
      prisma.invoice.count({ where: { schoolId: ctx.school.id } }),
    ])

    const steps = [
      { id: 1, label: 'Account created', complete: true, action: null },
      { id: 2, label: 'School details configured', complete: !!(ctx.school.paybill && ctx.school.paybill.trim()), action: '/settings' },
      { id: 3, label: 'Students uploaded', complete: studentCount > 0, action: '/students' },
      { id: 4, label: 'First statement uploaded', complete: paymentCount > 0, action: '/upload' },
      { id: 5, label: 'First invoice sent', complete: invoiceCount > 0, action: '/invoices' },
    ]

    const completedCount = steps.filter(s => s.complete).length
    return NextResponse.json({
      steps,
      completedCount,
      allComplete: completedCount === 5,
    })
  } catch (err) {
    console.error('onboarding status error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
