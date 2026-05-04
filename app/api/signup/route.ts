import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, password, schoolName, paybill, term } = body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      school: {
        create: {
          name: schoolName,
          paybill,
          currentTerm: term || 'Term 1 2026'
        }
      }
    }
  })

  return NextResponse.json({ success: true, userId: user.id })
}