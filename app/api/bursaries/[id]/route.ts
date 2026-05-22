import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { parseBody, updateBursarySchema } from '@/lib/schemas'

async function getBursaryCtx(req: Request, id: number) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return null
  const bursary = await prisma.bursary.findUnique({ where: { id }, include: { student: { select: { schoolId: true } } } })
  if (!bursary || bursary.student.schoolId !== ctx.school.id) return null
  return { ctx, bursary }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getBursaryCtx(req, Number(id))
  if (!data) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  if (!hasPermission(data.ctx.role, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(updateBursarySchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const d = parsed.data
    const patchData: Record<string, unknown> = {}
    if (d.type !== undefined) patchData.type = d.type
    if (d.description !== undefined) patchData.description = d.description || null
    if (d.discountType !== undefined) patchData.discountType = d.discountType
    if (d.discountValue !== undefined) patchData.discountValue = d.discountValue
    if (d.approvedBy !== undefined) patchData.approvedBy = d.approvedBy || null
    if (d.endDate !== undefined) patchData.endDate = d.endDate ? new Date(d.endDate) : null
    if (d.active !== undefined) patchData.active = d.active
    const updated = await prisma.bursary.update({ where: { id: Number(id) }, data: patchData })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('bursary PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getBursaryCtx(req, Number(id))
  if (!data) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  if (!hasPermission(data.ctx.role, 'students', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    await prisma.bursary.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('bursary DELETE error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
