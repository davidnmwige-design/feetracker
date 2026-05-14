import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { registerC2BUrls } from '@/lib/daraja'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true },
    })

    if (!user?.school?.paybill) {
      return NextResponse.json({ error: 'No paybill number configured for this school. Add it in school settings first.' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker-seven.vercel.app'
    const confirmationUrl = `${appUrl}/api/daraja/confirmation`
    const validationUrl = `${appUrl}/api/daraja/validation`

    const result = await registerC2BUrls(user.school.paybill, confirmationUrl, validationUrl)

    return NextResponse.json({ success: true, result, paybill: user.school.paybill, confirmationUrl, validationUrl })
  } catch (err: any) {
    console.error('[daraja] register error:', err)
    const msg = err?.response?.data?.errorMessage || err?.message || 'Registration failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
