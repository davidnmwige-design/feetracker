import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id: paramId } = await params
  const id = parseInt(paramId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const existing = await prisma.feeDiscount.findFirst({ where: { id, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Discount not found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = sanitize(body.name, 120)
  if (body.description !== undefined) data.description = body.description ? sanitize(body.description, 255) : null
  if (body.discountType !== undefined) data.discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage'
  if (body.discountValue !== undefined) data.discountValue = parseFloat(body.discountValue) || 0
  if (body.isSiblingDiscount !== undefined) data.isSiblingDiscount = body.isSiblingDiscount === true
  if (body.active !== undefined) data.active = body.active === true

  const updated = await prisma.feeDiscount.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id: paramId } = await params
  const id = parseInt(paramId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const existing = await prisma.feeDiscount.findFirst({ where: { id, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Discount not found' }, { status: 404 })

  await prisma.feeDiscount.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
