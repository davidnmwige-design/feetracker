import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function requireAdmin(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return user?.isAdmin ? user : null
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const schoolId = Number(id)
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.pdf')) return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 20MB' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const contract = await prisma.contract.upsert({
      where: { schoolId },
      update: { fileName: file.name, fileSize: file.size, fileData: buffer, uploadedAt: new Date() },
      create: { schoolId, fileName: file.name, fileSize: file.size, fileData: buffer },
    })
    return NextResponse.json({ id: contract.id, fileName: contract.fileName, fileSize: contract.fileSize, uploadedAt: contract.uploadedAt })
  } catch (err) {
    console.error('contract POST error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const schoolId = Number(id)
    const url = new URL(req.url)
    const metaOnly = url.searchParams.get('meta') === '1'

    if (metaOnly) {
      const contract = await prisma.contract.findUnique({
        where: { schoolId },
        select: { id: true, fileName: true, fileSize: true, uploadedAt: true }
      })
      if (!contract) return NextResponse.json({ error: 'No contract found' }, { status: 404 })
      return NextResponse.json(contract)
    }

    const contract = await prisma.contract.findUnique({ where: { schoolId } })
    if (!contract) return NextResponse.json({ error: 'No contract found' }, { status: 404 })

    return new Response(new Uint8Array(contract.fileData), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${contract.fileName}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const schoolId = Number(id)
    await prisma.contract.delete({ where: { schoolId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
