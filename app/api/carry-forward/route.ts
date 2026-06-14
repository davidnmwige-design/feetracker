import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { logAudit } from '@/lib/audit'

// POST /api/carry-forward — carries unpaid balances into the new term and updates school term
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'settings', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const { newTerm } = body as { newTerm: string }
    if (!newTerm?.trim()) return NextResponse.json({ error: 'newTerm is required' }, { status: 400 })

    const fromTerm = ctx.school.currentTerm
    const schoolId = ctx.school.id

    // Fetch all students with payments
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: { payments: { where: { matched: true } } },
    })

    let carried = 0
    let zeroed = 0

    await prisma.$transaction(async tx => {
      for (const student of students) {
        const totalPaid = student.payments.reduce((s, p) => s + p.amount, 0)
        const balance = student.feeRequired + student.carriedForwardBalance - totalPaid

        if (balance > 0) {
          // Record the carry-forward
          await tx.carryForwardRecord.create({
            data: { studentId: student.id, fromTerm, toTerm: newTerm, balance },
          })
          await tx.student.update({
            where: { id: student.id },
            data: { carriedForwardBalance: { increment: balance } },
          })
          carried++
        } else {
          // Reset carried balance for fully paid students
          if (student.carriedForwardBalance > 0) {
            await tx.student.update({
              where: { id: student.id },
              data: { carriedForwardBalance: 0 },
            })
            zeroed++
          }
        }
      }

      // Update school term
      await tx.school.update({ where: { id: schoolId }, data: { currentTerm: newTerm } })
    })

    await logAudit({
      userId: ctx.userId, schoolId, action: 'TERM_CHANGE',
      details: `Term changed from "${fromTerm}" to "${newTerm}". ${carried} balances carried forward, ${zeroed} balances cleared.`,
    })

    return NextResponse.json({ success: true, fromTerm, newTerm, carried, zeroed })
  } catch (err) {
    console.error('carry-forward error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
