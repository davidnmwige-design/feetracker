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
      include: { school: { include: { terms: { orderBy: { createdAt: 'desc' } } } } }
    })

    if (user?.school) {
      const role = await getUserRole(user.id, user.school)
      if (!hasPermission(role, 'terms', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })
    }

    return NextResponse.json(user?.school?.terms || [])
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    if (!user?.school) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    const rolePost = await getUserRole(user.id, user.school)
    if (!hasPermission(rolePost, 'terms', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    await prisma.school.update({
      where: { id: user.school.id },
      data: { currentTerm: termName }
    })

    const term = await prisma.term.create({
      data: { name: termName, schoolId: user.school.id }
    })

    return NextResponse.json(term)
  } catch (err) {
    console.error('terms POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
