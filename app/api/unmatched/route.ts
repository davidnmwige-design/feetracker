import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payments = await prisma.payment.findMany({
    where: { matched: false },
    orderBy: { paidAt: 'desc' }
  })

  return NextResponse.json(payments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paymentId, studentId } = await req.json()

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { studentId, matched: true }
  })

  return NextResponse.json(payment)
}