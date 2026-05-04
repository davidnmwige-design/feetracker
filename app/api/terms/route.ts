import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: { include: { terms: { orderBy: { createdAt: 'desc' } } } } }
  })

  return NextResponse.json(user?.school?.terms || [])
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { termName } = await req.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true }
  })

  if (!user?.school) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  await prisma.school.update({
    where: { id: user.school.id },
    data: { currentTerm: termName }
  })

  const term = await prisma.term.create({
    data: {
      name: termName,
      schoolId: user.school.id
    }
  })

  return NextResponse.json(term)
}