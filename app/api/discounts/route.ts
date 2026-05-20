import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const discounts = await prisma.feeDiscount.findMany({
    where: { schoolId: ctx.school.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(discounts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const name = sanitize(body.name, 120)
  const description = body.description ? sanitize(body.description, 255) : null
  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage'
  const discountValue = parseFloat(body.discountValue) || 0
  const isSiblingDiscount = body.isSiblingDiscount === true
  const active = body.active !== false

  if (!name) return NextResponse.json({ error: 'Discount name is required' }, { status: 400 })
  if (discountValue <= 0) return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 })
  if (discountType === 'percentage' && discountValue > 100) return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 })

  const discount = await prisma.feeDiscount.create({
    data: {
      schoolId: ctx.school.id,
      name,
      description,
      discountType,
      discountValue,
      isSiblingDiscount,
      active,
    },
  })
  return NextResponse.json(discount, { status: 201 })
}
