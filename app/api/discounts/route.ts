export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { validateName, validateEnum, validateAmount } from '@/lib/validation'

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
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()

  const nameResult = validateName(body.name, 'Discount name', 80)
  if (!nameResult.valid) return NextResponse.json({ error: nameResult.error }, { status: 400 })

  const typeResult = validateEnum(body.discountType, ['percentage', 'fixed'], 'Discount type')
  if (!typeResult.valid) return NextResponse.json({ error: typeResult.error }, { status: 400 })

  const valueResult = validateAmount(body.discountValue, 'Discount value')
  if (!valueResult.valid) return NextResponse.json({ error: valueResult.error }, { status: 400 })
  if (valueResult.sanitized <= 0) return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 })
  if (typeResult.sanitized === 'percentage' && valueResult.sanitized > 100) return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 })

  const name = nameResult.sanitized
  const description = body.description ? sanitize(body.description, 255) : null
  const discountType = typeResult.sanitized as string
  const discountValue = valueResult.sanitized as number
  const isSiblingDiscount = body.isSiblingDiscount === true
  const active = body.active !== false

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
