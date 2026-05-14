import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib'
import qrcode from 'qrcode'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/encrypt'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = await generateSecret()
  const otpAuthUrl = await generateURI({
    label: session.user.email,
    issuer: 'FeeTracker',
    secret,
  } as any)
  const qrCode = await qrcode.toDataURL(otpAuthUrl)

  return NextResponse.json({ secret, qrCode })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { secret, code } = await req.json()
  if (!secret || !code) {
    return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 })
  }

  const result = await verifyTotp({ token: String(code), secret } as any)
  const isValid = typeof result === 'object' ? result.valid : !!result

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { twoFactorEnabled: true, twoFactorSecret: encrypt(secret) },
  })

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
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  })

  return NextResponse.json({ success: true })
}
