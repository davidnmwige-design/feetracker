import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'

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
    const body = await req.json()
    const updated = await prisma.bursary.update({
      where: { id: Number(id) },
      data: {
        type: body.type ? sanitize(body.type, 50) : undefined,
        description: body.description !== undefined ? (body.description ? sanitize(body.description, 200) : null) : undefined,
        discountType: body.discountType ? sanitize(body.discountType, 20) : undefined,
        discountValue: body.discountValue !== undefined ? Number(body.discountValue) : undefined,
        approvedBy: body.approvedBy !== undefined ? (body.approvedBy ? sanitize(body.approvedBy, 100) : null) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    })
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
