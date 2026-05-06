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
    const schoolName = sanitize(body.schoolName, 200)
    const paybill = sanitize(body.paybill, 50)
    const term = sanitize(body.term, 100)

    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 })
    }

    if (!name || !email || !schoolName) {
      return NextResponse.json({ error: 'Name, email, and school name are required' }, { status: 400 })
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
  } catch (err) {
    console.error('signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
