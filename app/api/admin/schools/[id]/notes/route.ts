import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function getAdmin(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return null
  return user
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const notes = await prisma.schoolNote.findMany({
    where: { schoolId: Number(id) },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const note = await prisma.schoolNote.create({
    data: { schoolId: Number(id), content: content.trim() },
  })
  return NextResponse.json(note)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  await prisma.schoolNote.delete({ where: { id: Number(noteId) } })
  return NextResponse.json({ ok: true })
}
