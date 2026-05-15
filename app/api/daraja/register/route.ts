import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { registerC2BUrls } from '@/lib/daraja'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx?.school?.paybill) {
      return NextResponse.json({ error: 'No paybill number configured for this school. Add it in school settings first.' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker-seven.vercel.app'
    const confirmationUrl = `${appUrl}/api/daraja/confirmation`
    const validationUrl = `${appUrl}/api/daraja/validation`

    const result = await registerC2BUrls(ctx.school.paybill, confirmationUrl, validationUrl)

    return NextResponse.json({ success: true, result, paybill: ctx.school.paybill, confirmationUrl, validationUrl })
  } catch (err: any) {
    console.error('[daraja] register error:', err)
    const msg = err?.response?.data?.errorMessage || err?.message || 'Registration failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
