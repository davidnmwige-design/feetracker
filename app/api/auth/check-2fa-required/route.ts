import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ required: false })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { twoFactorEnabled: true },
  })

  return NextResponse.json({ required: user?.twoFactorEnabled ?? false })
}
