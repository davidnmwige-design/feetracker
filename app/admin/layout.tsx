import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminCount = await prisma.user.count({ where: { isAdmin: true } })

  // If no admins exist yet, allow access to the setup page without auth
  if (adminCount === 0) {
    return <>{children}</>
  }

  // Require authentication for all admin pages
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true, name: true },
  })

  if (!user?.isAdmin) {
    redirect('/dashboard')
  }

  return <AdminSidebar adminName={user.name}>{children}</AdminSidebar>
}
