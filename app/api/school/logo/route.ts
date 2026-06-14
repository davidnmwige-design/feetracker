import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { uploadToR2, deleteFromR2, isR2Url } from '@/lib/storage'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, GIF, and WebP files are allowed' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File must be smaller than 2MB' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Delete old logo from R2 if it exists there
  const existing = await prisma.school.findUnique({ where: { id: ctx.school.id }, select: { logoUrl: true } })
  if (existing?.logoUrl && isR2Url(existing.logoUrl)) {
    await deleteFromR2(existing.logoUrl).catch(() => {})
  }

  // Try R2 first, fall back to base64
  const ext = file.type.split('/')[1] || 'png'
  const key = `logos/school-${ctx.school.id}-${Date.now()}.${ext}`
  const r2Url = await uploadToR2(key, buffer, file.type).catch(() => null)

  const logoUrl = r2Url ?? `data:${file.type};base64,${buffer.toString('base64')}`

  await prisma.school.update({ where: { id: ctx.school.id }, data: { logoUrl } })
  return NextResponse.json({ logoUrl })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const school = await prisma.school.findUnique({ where: { id: ctx.school.id }, select: { logoUrl: true } })
  if (school?.logoUrl && isR2Url(school.logoUrl)) {
    await deleteFromR2(school.logoUrl).catch(() => {})
  }

  await prisma.school.update({ where: { id: ctx.school.id }, data: { logoUrl: null } })
  return NextResponse.json({ success: true })
}
