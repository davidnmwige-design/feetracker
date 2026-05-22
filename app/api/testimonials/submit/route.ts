import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { parseBody, testimonialSubmitSchema } from '@/lib/schemas'

function verifyToken(schoolId: string, token: string): boolean {
  const expected = crypto.createHash('sha256').update(schoolId + (process.env.NEXTAUTH_SECRET || '')).digest('hex').slice(0, 16)
  return token === expected
}

export async function POST(req: Request) {
  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const parsed = parseBody(testimonialSubmitSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { schoolId, token, authorName, authorTitle, rating, quote } = parsed.data

  if (!verifyToken(String(schoolId), token)) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })

  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  await prisma.testimonial.upsert({
    where: { schoolId },
    update: { quote, authorName, authorTitle, schoolName: school.name, rating, submittedAt: new Date(), approved: false },
    create: { schoolId, quote, authorName, authorTitle, schoolName: school.name, rating, submittedAt: new Date(), approved: false },
  })

  return NextResponse.json({ success: true })
}
