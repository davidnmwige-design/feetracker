import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

async function getSchool(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  return user?.school ?? null
}

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = Number(searchParams.get('studentId'))
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: school.id } })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cats = await prisma.feeCategory.findMany({ where: { studentId } })
  return NextResponse.json(cats)
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { studentId, categories } = body

  const student = await prisma.student.findFirst({ where: { id: Number(studentId), schoolId: school.id } })
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
