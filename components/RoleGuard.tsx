'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/hooks/useRole'
import { ROLE_PERMISSIONS } from '@/lib/roleContext'

type Permission = keyof typeof ROLE_PERMISSIONS['owner']

interface RoleGuardProps {
  requiredPermission: Permission
  children: React.ReactNode
}

export default function RoleGuard({ requiredPermission, children }: RoleGuardProps) {
  const { role, loading } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role !== 'owner') {
      const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
      if (perms && !perms[requiredPermission]) {
        router.replace('/dashboard')
      }
    }
  }, [role, loading, requiredPermission, router])

  // While loading: show children (fail open — better UX, avoids blank flash)
  if (loading) return <>{children}</>

  // Owner always sees everything
  if (role === 'owner') return <>{children}</>

  const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
  if (!perms || !perms[requiredPermission]) return null
  return <>{children}</>
}
