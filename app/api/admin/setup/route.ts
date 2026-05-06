import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const name = sanitize(body.name, 100)
    const email = sanitize(body.email, 200).toLowerCase()
    const password = body.password as string
    const secretKey = body.secretKey as string

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 })
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
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
  } catch (err) {
    console.error('admin setup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
