export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { parseBody, createDiscountSchema } from '@/lib/schemas'

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

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(createDiscountSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, description, discountType, discountValue, isSiblingDiscount = false, active = true } = parsed.data

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
