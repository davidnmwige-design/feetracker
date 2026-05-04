import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, password, secretKey } = body

  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, isAdmin: true }
  })

  return NextResponse.json({ success: true, userId: user.id })
}