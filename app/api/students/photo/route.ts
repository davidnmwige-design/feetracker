import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 1 * 1024 * 1024 // 1MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get('studentId') || '')
  if (isNaN(studentId)) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, or WebP files are allowed' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Photo must be smaller than 1MB' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const photoUrl = `data:${file.type};base64,${base64}`

  await prisma.student.update({ where: { id: studentId }, data: { photoUrl } })
  return NextResponse.json({ photoUrl })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get('studentId') || '')
  if (isNaN(studentId)) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  await prisma.student.update({ where: { id: studentId }, data: { photoUrl: null } })
  return NextResponse.json({ success: true })
}
