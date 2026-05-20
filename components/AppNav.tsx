'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { useRole } from '@/hooks/useRole'
import { ROLE_PERMISSIONS } from '@/lib/roleContext'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const ALL_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', page: 'dashboard' },
  { href: '/students',  label: 'Students',  page: 'students'  },
  { href: '/invoices',  label: 'Invoices',  page: 'invoices'  },
  { href: '/reminders', label: 'Reminders', page: 'reminders' },
  { href: '/upload',    label: 'Upload',    page: 'upload'    },
  { href: '/unmatched', label: 'Unmatched', page: 'unmatched' },
  { href: '/reports',   label: 'Reports',   page: 'reports'   },
  { href: '/settings',  label: 'Settings',  page: 'settings'  },
]

const ROLE_LABELS: Record<string, string> = {
  accountant: 'Accountant',
  principal:  'Principal',
  viewer:     'Viewer',
  admin:      'Admin',
}

export default function AppNav() {
  const pathname = usePathname()
  const { role, loading } = useRole()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState('#c8a84b')

  useEffect(() => {
    fetch('/api/school').then(r => r.json()).then(d => {
      if (d?.logoUrl) setLogoUrl(d.logoUrl)
      if (d?.brandColor) setBrandColor(d.brandColor)
    }).catch(() => {})
  }, [])

  if (pathname.startsWith('/admin')) return null
  const hideNav = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-2fa', '/trial-expired', '/demo', '/privacy'].some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
  if (hideNav) return null

  // While loading, show all links (fail open)
  const allowedPages = loading
    ? ALL_NAV_LINKS.map(l => l.page)
    : (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.pages ?? ALL_NAV_LINKS.map(l => l.page))

  const visibleLinks = ALL_NAV_LINKS.filter(l => allowedPages.includes(l.page))
  const showRoleBadge = !loading && role !== 'owner'

  return (
    <nav style={{
      background: '#0a1f4e',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: '48px',
      minHeight: '48px',
      gap: '12px',
      overflow: 'hidden',
    }}>
      <style>{`
        .appnav-links::-webkit-scrollbar { display: none; }
        .appnav-links { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Link href="/dashboard" style={{
        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px',
      }}>
        {logoUrl ? (
          <>
            <img src={logoUrl} alt="School logo" style={{maxHeight: '32px', maxWidth: '100px', objectFit: 'contain'}} />
            <span style={{fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px'}}>Powered by Elimu Pay</span>
          </>
        ) : (
          <span style={{fontSize: '16px', fontWeight: 700, fontFamily: 'Georgia, serif'}}>
            <span style={{color: '#fff'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span>
          </span>
        )}
      </Link>

      <div className="appnav-links" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        flexShrink: 1,
        minWidth: 0,
        paddingRight: '4px',
      }}>
        {visibleLinks.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontSize: '13px',
            color: pathname === href ? '#ffffff' : 'rgba(255,255,255,0.65)',
            fontWeight: pathname === href ? 700 : 400,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            borderBottom: pathname === href ? `2px solid ${brandColor}` : '2px solid transparent',
            padding: '2px 0',
          }}>
            {label}
          </Link>
        ))}

        {showRoleBadge && (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {ROLE_LABELS[role] ?? role}
          </span>
        )}

        <ThemeToggle />
        <div style={{flexShrink: 0}}>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
