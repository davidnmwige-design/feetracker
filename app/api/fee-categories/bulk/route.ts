import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { parseBody, bulkFeeCategorySchema } from '@/lib/schemas'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  if (!hasPermission(ctx.role, 'fee-categories', 'POST')) {
    return NextResponse.json(FORBIDDEN, { status: 403 })
  }

  try {
    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(bulkFeeCategorySchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const { mode, className, categoryName, newAmount } = parsed.data
    const amount = newAmount
    const name = categoryName
    const schoolId = ctx.school.id

    const studentWhere: Record<string, unknown> = { schoolId }
    if (className && className !== 'All' && className.trim() !== '') {
      studentWhere.class = className.trim()
    }

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: { feeCategories: true },
    })

    let updated = 0
    for (const student of students) {
      const existing = student.feeCategories.find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )

      if (mode === 'update') {
        if (!existing) continue
        await prisma.feeCategory.update({
          where: { id: existing.id },
          data: { amount },
        })
      } else {
        // mode === 'add': only add to students who don't have it yet
        if (existing) continue
        await prisma.feeCategory.create({
          data: { studentId: student.id, name, amount },
        })
      }

      // Recalculate feeRequired = sum of all categories for this student
      const allCats = await prisma.feeCategory.findMany({ where: { studentId: student.id } })
      const newTotal = allCats.reduce((sum, c) => sum + c.amount, 0)
      await prisma.student.update({
        where: { id: student.id },
        data: { feeRequired: newTotal },
      })
      updated++
    }

    let message: string
    if (mode === 'add') {
      const classDesc = className && className !== 'All' ? ` in ${className}` : ''
      message = `Added "${name}" (KES ${amount.toLocaleString()}) to ${updated} student${updated !== 1 ? 's' : ''}${classDesc}`
    } else {
      message = `Updated ${updated} student${updated !== 1 ? 's' : ''} — set "${name}" to KES ${amount.toLocaleString()}`
    }

    return NextResponse.json({ updated, message, categoryName: name, newAmount: amount, className, mode })
  } catch (err) {
    console.error('[bulk-fees] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
