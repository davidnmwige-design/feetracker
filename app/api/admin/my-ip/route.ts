import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'

  const allowedIps = process.env.ADMIN_ALLOWED_IPS || ''

  return NextResponse.json({
    ip,
    allowed: !allowedIps.trim() || allowedIps.split(',').map(s => s.trim()).includes(ip),
    configured: !!allowedIps.trim(),
  })
}
