import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ role: 'viewer' })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ role: 'viewer' })

    // School owner gets 'owner' role regardless of SchoolUser table
    const isOwner = ctx.userId === ctx.school.userId
    const role = isOwner ? 'owner' : (ctx.role ?? 'viewer')

    return NextResponse.json({ role })
  } catch {
    return NextResponse.json({ role: 'owner' })
  }
}
