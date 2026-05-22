export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id } = await params
  const recordId = parseInt(id)
  const existing = await prisma.academicYear.findFirst({ where: { id: recordId, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  if (body.activate === true) {
    await prisma.academicYear.updateMany({ where: { schoolId: ctx.school.id }, data: { isActive: false } })
    const updated = await prisma.academicYear.update({ where: { id: recordId }, data: { isActive: true } })
    return NextResponse.json(updated)
  }

  const data: Record<string, unknown> = {}
  if (body.term1Start !== undefined) data.term1Start = body.term1Start ? new Date(body.term1Start) : null
  if (body.term1End !== undefined) data.term1End = body.term1End ? new Date(body.term1End) : null
  if (body.term2Start !== undefined) data.term2Start = body.term2Start ? new Date(body.term2Start) : null
  if (body.term2End !== undefined) data.term2End = body.term2End ? new Date(body.term2End) : null
  if (body.term3Start !== undefined) data.term3Start = body.term3Start ? new Date(body.term3Start) : null
  if (body.term3End !== undefined) data.term3End = body.term3End ? new Date(body.term3End) : null

  const updated = await prisma.academicYear.update({ where: { id: recordId }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id } = await params
  const recordId = parseInt(id)
  const existing = await prisma.academicYear.findFirst({ where: { id: recordId, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isActive) return NextResponse.json({ error: 'Cannot delete the active academic year' }, { status: 400 })

  await prisma.academicYear.delete({ where: { id: recordId } })
  return NextResponse.json({ success: true })
}
