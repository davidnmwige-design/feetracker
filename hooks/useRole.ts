'use client'
import { useState, useEffect } from 'react'

export function useRole() {
  const [role, setRole] = useState<string>('owner') // default to owner — fail open
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team/my-role')
      .then(r => r.json())
      .then(data => {
        setRole(data.role || 'owner') // fallback to owner if empty
        setLoading(false)
      })
      .catch(() => {
        setRole('owner') // on any error, default to owner
        setLoading(false)
      })
  }, [])

  return { role, loading }
}
