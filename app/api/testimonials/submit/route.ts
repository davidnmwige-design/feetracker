import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sanitize } from '@/lib/sanitize'
import crypto from 'crypto'

function verifyToken(schoolId: string, token: string): boolean {
  const expected = crypto.createHash('sha256').update(schoolId + (process.env.NEXTAUTH_SECRET || '')).digest('hex').slice(0, 16)
  return token === expected
}

export async function POST(req: Request) {
  const body = await req.json()
  const schoolId = parseInt(body.schoolId)
  const token = String(body.token || '')

  if (!schoolId || !token) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  if (!verifyToken(String(schoolId), token)) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })

  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const quote = sanitize(body.quote, 500)
  const authorName = sanitize(body.authorName, 120)
  const authorTitle = sanitize(body.authorTitle, 120)
  const rating = Math.min(5, Math.max(1, parseInt(body.rating) || 5))

  if (!quote || quote.length < 20) return NextResponse.json({ error: 'Please write at least 20 characters' }, { status: 400 })
  if (!authorName) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })

  await prisma.testimonial.upsert({
    where: { schoolId },
    update: { quote, authorName, authorTitle, schoolName: school.name, rating, submittedAt: new Date(), approved: false },
    create: { schoolId, quote, authorName, authorTitle, schoolName: school.name, rating, submittedAt: new Date(), approved: false },
  })

  return NextResponse.json({ success: true })
}
