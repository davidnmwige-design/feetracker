import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'fee-categories', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const { searchParams } = new URL(req.url)
  const studentId = Number(searchParams.get('studentId'))
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cats = await prisma.feeCategory.findMany({ where: { studentId } })
  return NextResponse.json(cats)
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'fee-categories', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const { studentId, categories } = body

  const student = await prisma.student.findFirst({ where: { id: Number(studentId), schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!Array.isArray(categories)) return NextResponse.json({ error: 'categories must be array' }, { status: 400 })

  await prisma.feeCategory.deleteMany({ where: { studentId: Number(studentId) } })

  const created = []
  let total = 0
  for (const cat of categories) {
    const name = sanitize(String(cat.name || ''), 100)
    const amount = Math.max(0, Number(cat.amount) || 0)
    if (!name) continue
    created.push(await prisma.feeCategory.create({ data: { studentId: Number(studentId), name, amount } }))
    total += amount
  }

  await prisma.student.update({ where: { id: Number(studentId) }, data: { feeRequired: total } })

  return NextResponse.json({ categories: created, total })
}
