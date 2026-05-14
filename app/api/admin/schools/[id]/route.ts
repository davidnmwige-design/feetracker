import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const school = await prisma.school.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        students: { include: { payments: true } },
        _count: { select: { students: true } }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const lastDarajaPayment = await prisma.payment.findFirst({
      where: { schoolId: Number(id), source: 'daraja' },
      orderBy: { paidAt: 'desc' },
      select: { paidAt: true, amount: true, senderName: true },
    })

    return NextResponse.json({
      ...school,
      darajaEnabled: !!process.env.DARAJA_CONSUMER_KEY,
      lastDarajaPayment: lastDarajaPayment
        ? { paidAt: lastDarajaPayment.paidAt.toISOString(), amount: lastDarajaPayment.amount, senderName: lastDarajaPayment.senderName }
        : null,
    })
  } catch (err) {
    console.error('admin school detail error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
