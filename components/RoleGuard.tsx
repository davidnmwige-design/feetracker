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

  const perms = ROLE_PERMISSIONS[role]
  const allowed = perms?.[requiredPermission] as boolean | undefined

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace('/dashboard')
    }
  }, [loading, allowed, router])

  if (loading) return null
  if (!allowed) return null
  return <>{children}</>
}
