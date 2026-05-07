import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function requireAdmin(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return user?.isAdmin ? user : null
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const settings = await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {
        trialDays: typeof body.trialDays === 'number' ? body.trialDays : undefined,
        defaultPlan: body.defaultPlan || undefined,
        maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : undefined,
        announcement: typeof body.announcement === 'string' ? body.announcement : undefined,
        notifyNewSchool: typeof body.notifyNewSchool === 'boolean' ? body.notifyNewSchool : undefined,
        notifyTrialExpiry: typeof body.notifyTrialExpiry === 'boolean' ? body.notifyTrialExpiry : undefined,
        notifyUpgradeRequest: typeof body.notifyUpgradeRequest === 'boolean' ? body.notifyUpgradeRequest : undefined,
        notifyAccountDeleted: typeof body.notifyAccountDeleted === 'boolean' ? body.notifyAccountDeleted : undefined,
      },
      create: { id: 1, ...body },
    })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
