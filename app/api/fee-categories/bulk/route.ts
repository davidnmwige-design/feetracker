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
    console.log('[bulk-fees] request body:', JSON.stringify(body))

    // Accept both className (spec) and classFilter (legacy) for backwards compat
    const className = body.className ?? body.classFilter ?? 'All'
    const categoryName = body.categoryName
    const newAmount = body.newAmount

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      return NextResponse.json({ error: 'categoryName is required' }, { status: 400 })
    }
    if (newAmount === undefined || newAmount === null || isNaN(Number(newAmount))) {
      return NextResponse.json({ error: 'newAmount is required and must be a number' }, { status: 400 })
    }

    const amount = Math.max(0, Number(newAmount))
    const name = sanitize(categoryName.trim(), 100)
    const schoolId = user.school.id

    // Build student query — scope to school, optionally filter by class
    const studentWhere: Record<string, unknown> = { schoolId }
    if (className && className !== 'All' && className.trim() !== '') {
      studentWhere.class = sanitize(className.trim(), 50)
    }

    console.log('[bulk-fees] finding students with where:', JSON.stringify(studentWhere))

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: { feeCategories: true },
    })

    console.log(`[bulk-fees] found ${students.length} students, category="${name}", amount=${amount}`)

    let updated = 0
    for (const student of students) {
      // Case-insensitive match on existing categories
      const existing = student.feeCategories.find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )

      if (existing) {
        // Update existing category
        await prisma.feeCategory.update({
          where: { id: existing.id },
          data: { amount },
        })
        console.log(`[bulk-fees] updated category id=${existing.id} for student "${student.name}"`)
      } else {
        // Create new category for this student
        await prisma.feeCategory.create({
          data: { studentId: student.id, name, amount },
        })
        console.log(`[bulk-fees] created new category "${name}" for student "${student.name}"`)
      }

      // Recalculate feeRequired = sum of ALL fee categories for this student
      const allCats = await prisma.feeCategory.findMany({ where: { studentId: student.id } })
      const newTotal = allCats.reduce((sum, c) => sum + c.amount, 0)
      await prisma.student.update({
        where: { id: student.id },
        data: { feeRequired: newTotal },
      })

      updated++
    }

    const message = `Updated ${updated} student${updated !== 1 ? 's' : ''} — set "${name}" to KES ${amount.toLocaleString()}`
    console.log('[bulk-fees] done:', message)

    return NextResponse.json({ updated, message, categoryName: name, newAmount: amount, className })
  } catch (err) {
    console.error('[bulk-fees] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
