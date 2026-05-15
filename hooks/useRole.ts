'use client'
import { useState, useEffect } from 'react'
import type { UserRole } from '@/lib/roleContext'

export function useRole() {
  const [role, setRole] = useState<UserRole>('owner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team/my-role')
      .then(r => r.json())
      .then(data => {
        setRole((data.role as UserRole) || 'owner')
        setLoading(false)
      })
      .catch(() => {
        setRole('owner')
        setLoading(false)
      })
  }, [])

  return { role, loading }
}
