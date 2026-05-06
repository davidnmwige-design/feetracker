import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const { email } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    await prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true }
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordReset.create({
      data: { email, token, expiresAt }
    })
  }

  return NextResponse.json({ success: true })
}
