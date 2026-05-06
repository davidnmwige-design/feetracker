import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, password, schoolName, paybill, term } = body

  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      school: {
        create: {
          name: schoolName,
          paybill,
          currentTerm: term || 'Term 1 2026',
          trialEndsAt
        }
      }
    }
  })

  return NextResponse.json({ success: true, userId: user.id })
}
