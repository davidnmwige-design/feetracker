import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json([])

    if (!hasPermission(ctx.role, 'terms', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const terms = await prisma.term.findMany({
      where: { schoolId: ctx.school.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(terms)
  } catch (err) {
    console.error('terms GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const termName = sanitize(body.termName, 100)

    if (!termName) {
      return NextResponse.json({ error: 'Term name is required' }, { status: 400 })
    }

    const ctx = await resolveSchool(session.user.email)
    if (!ctx) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    if (!hasPermission(ctx.role, 'terms', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    await prisma.school.update({
      where: { id: ctx.school.id },
      data: { currentTerm: termName }
    })

    const term = await prisma.term.create({
      data: { name: termName, schoolId: ctx.school.id }
    })

    return NextResponse.json(term)
  } catch (err) {
    console.error('terms POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
