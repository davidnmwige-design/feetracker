import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  if (!user?.school) return NextResponse.json({ error: 'No school found' }, { status: 400 })

  const role = await getUserRole(user.id, user.school)
  if (!hasPermission(role, 'fee-categories', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const { classFilter, categoryName, newAmount } = body

  if (!categoryName || newAmount === undefined || newAmount === null) {
    return NextResponse.json({ error: 'categoryName and newAmount are required' }, { status: 400 })
  }

  const amount = Math.max(0, Number(newAmount) || 0)
  const name = sanitize(String(categoryName), 100)

  const studentWhere: Record<string, unknown> = { schoolId: user.school.id }
  if (classFilter && classFilter !== 'All') {
    studentWhere.class = sanitize(String(classFilter), 50)
  }

  const students = await prisma.student.findMany({
    where: studentWhere,
    include: { feeCategories: true },
  })

  let updated = 0
  for (const student of students) {
    const cat = student.feeCategories.find(c => c.name === name)
    if (!cat) continue
    await prisma.feeCategory.update({ where: { id: cat.id }, data: { amount } })
    const newTotal = student.feeCategories.reduce((sum, c) => sum + (c.id === cat.id ? amount : c.amount), 0)
    await prisma.student.update({ where: { id: student.id }, data: { feeRequired: newTotal } })
    updated++
  }

  return NextResponse.json({ updated, categoryName: name, newAmount: amount, classFilter: classFilter || 'All' })
}
