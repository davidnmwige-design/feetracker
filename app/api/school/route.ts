import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    return NextResponse.json(user?.school || null)
  } catch (err) {
    console.error('school GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    if (!user?.school) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    const body = await req.json()
    const allowed = ['paybill', 'accountNumberFormat'] as const
    const data: Record<string, string | null> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key] != null ? sanitize(String(body[key]), 200) : null
    }

    const school = await prisma.school.update({
      where: { id: user.school.id },
      data,
    })

    return NextResponse.json(school)
  } catch (err) {
    console.error('school PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
