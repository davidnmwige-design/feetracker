import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true },
  })
  if (!user?.school) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  const role = await getUserRole(user.id, user.school)
  if (!hasPermission(role, 'fee-categories', 'POST')) {
    return NextResponse.json(FORBIDDEN, { status: 403 })
  }

  try {
    const body = await req.json()

    // mode: 'update' = update amount where category exists (skip students without it)
    // mode: 'add'    = create category for students who don't have it yet
    const mode: 'update' | 'add' = body.mode === 'add' ? 'add' : 'update'

    // Accept both className (spec) and classFilter (legacy)
    const className = body.className ?? body.classFilter ?? 'All'
    const categoryName = body.categoryName
    const newAmount = body.newAmount ?? body.amount

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      return NextResponse.json({ error: 'categoryName is required' }, { status: 400 })
    }
    if (newAmount === undefined || newAmount === null || isNaN(Number(newAmount))) {
      return NextResponse.json({ error: 'newAmount is required and must be a number' }, { status: 400 })
    }

    const amount = Math.max(0, Number(newAmount))
    const name = sanitize(categoryName.trim(), 100)
    const schoolId = user.school.id

    const studentWhere: Record<string, unknown> = { schoolId }
    if (className && className !== 'All' && className.trim() !== '') {
      studentWhere.class = sanitize(className.trim(), 50)
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
