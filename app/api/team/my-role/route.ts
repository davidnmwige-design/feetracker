import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ role: 'owner' }) // fail open — no session = not a team member
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        school: true,
        schoolUsers: { include: { school: true } },
      },
    })

    if (!user) return NextResponse.json({ role: 'owner' })

    // Platform admins always get full access
    if (user.isAdmin) return NextResponse.json({ role: 'owner' })

    // School owner — user created a school
    if (user.school) return NextResponse.json({ role: 'owner' })

    // Team member — look up SchoolUser record
    if (user.schoolUsers && user.schoolUsers.length > 0) {
      const schoolUser = user.schoolUsers[0]
      // admin team member gets same access as owner
      const role = (schoolUser.role === 'admin' || schoolUser.role === 'owner')
        ? 'owner'
        : schoolUser.role
      return NextResponse.json({ role })
    }

    // Default: never restrict unnecessarily
    return NextResponse.json({ role: 'owner' })
  } catch (err) {
    console.error('my-role error:', err)
    return NextResponse.json({ role: 'owner' }) // always fail open
  }
}
