import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function getAdmin(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return null
  return user
}

export async function GET(req: Request) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const url = new URL(req.url)
    const schoolId = url.searchParams.get('schoolId') ? Number(url.searchParams.get('schoolId')) : undefined
    const action = url.searchParams.get('action') || undefined
    const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
    const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const limit = 50

    const where: any = {}
    if (schoolId) where.schoolId = schoolId
    if (action) where.action = action
    if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('admin/audit GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
