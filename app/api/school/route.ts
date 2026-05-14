import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

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

    if (user?.school) {
      const role = await getUserRole(user.id, user.school)
      if (!hasPermission(role, 'school', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })
    }

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

    const rolePatch = await getUserRole(user.id, user.school)
    if (!hasPermission(rolePatch, 'school', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const data: Record<string, unknown> = {}
    const strings = ['name', 'paybill', 'accountNumberFormat', 'currentTerm', 'replyToEmail', 'emailSignature', 'whatsappNumber', 'penaltyType']
    const booleans = ['penaltyEnabled']
    const numbers = ['penaltyAmount', 'penaltyDueDate']
    for (const key of strings) {
      if (key in body) data[key] = body[key] != null ? sanitize(String(body[key]), 200) : null
    }
    for (const key of booleans) {
      if (key in body) data[key] = Boolean(body[key])
    }
    for (const key of numbers) {
      if (key in body) data[key] = Number(body[key]) || 0
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
