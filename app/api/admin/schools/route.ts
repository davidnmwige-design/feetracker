import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { parsePagination, paginatedResponse } from '@/lib/pagination'

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

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const pg = parsePagination(searchParams)
    const where = q ? { OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { user: { email: { contains: q, mode: 'insensitive' as const } } },
    ] } : {}
    const include = { user: true, _count: { select: { students: true } } }

    const pendingRequests = await prisma.planUpgradeRequest.groupBy({
      by: ['schoolId'],
      where: { status: 'pending' },
      _count: true,
    })
    const pendingBySchool = Object.fromEntries(pendingRequests.map(r => [r.schoolId, r._count]))
    const withPending = <T extends { id: number }>(arr: T[]) => arr.map(s => ({ ...s, pendingUpgrades: pendingBySchool[s.id] || 0 }))

    if (pg.paginated) {
      const [total, schools] = await Promise.all([
        prisma.school.count({ where }),
        prisma.school.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: pg.skip, take: pg.take }),
      ])
      return NextResponse.json(paginatedResponse(withPending(schools), total, pg))
    }

    const schools = await prisma.school.findMany({ where, include, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(withPending(schools))
  } catch (err) {
    console.error('admin schools GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
