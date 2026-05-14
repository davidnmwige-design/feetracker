import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const otpRecord = await prisma.oTPCode.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
  }

  if (otpRecord.code !== String(code)) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { used: true } })
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { twoFactorEnabled: false },
  })

  return NextResponse.json({ success: true })
}
