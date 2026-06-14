'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Silently refreshes the JWT session by calling /api/auth/session every 13 min.
// If the session has expired, redirects to /login?expired=1.
export default function SessionRefreshHandler() {
  const router = useRouter()

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!data?.user) {
            // Session expired — redirect only if we were previously authenticated
            if (sessionStorage.getItem('ep_was_authenticated')) {
              sessionStorage.removeItem('ep_was_authenticated')
              router.push('/login?expired=1')
            }
          } else {
            sessionStorage.setItem('ep_was_authenticated', '1')
          }
        }
      } catch {
        // Network error — don't redirect
      }
    }

    // Initial check to mark as authenticated
    refresh()

    // Refresh every 13 min (before 15-min token expires)
    const interval = setInterval(refresh, 13 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  return null
}
