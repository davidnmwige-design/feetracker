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
    const schoolIdParam = url.searchParams.get('schoolId')

    const where = schoolIdParam ? { schoolId: Number(schoolIdParam) } : {}
    const records = await prisma.billingRecord.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return NextResponse.json(records)
  } catch (err) {
    console.error('billing GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { schoolId, month, year, amount, isPaid } = await req.json()
    if (!schoolId || !month || !year) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const record = await prisma.billingRecord.upsert({
      where: { schoolId_month_year: { schoolId: Number(schoolId), month: Number(month), year: Number(year) } },
      update: {
        isPaid: Boolean(isPaid),
        paidAt: isPaid ? new Date() : null,
        amount: Number(amount),
      },
      create: {
        schoolId: Number(schoolId),
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        isPaid: Boolean(isPaid),
        paidAt: isPaid ? new Date() : null,
      },
    })
    return NextResponse.json(record)
  } catch (err) {
    console.error('billing POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
