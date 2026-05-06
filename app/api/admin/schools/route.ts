import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

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
      where: { email: session.user.email }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schools = await prisma.school.findMany({
      include: {
        user: true,
        _count: { select: { students: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const pendingRequests = await prisma.planUpgradeRequest.groupBy({
      by: ['schoolId'],
      where: { status: 'pending' },
      _count: true,
    })
    const pendingBySchool = Object.fromEntries(pendingRequests.map(r => [r.schoolId, r._count]))
    const schoolsWithPending = schools.map(s => ({ ...s, pendingUpgrades: pendingBySchool[s.id] || 0 }))

    return NextResponse.json(schoolsWithPending)
  } catch (err) {
    console.error('admin schools GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
