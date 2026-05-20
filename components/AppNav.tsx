'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { useRole } from '@/hooks/useRole'
import { ROLE_PERMISSIONS } from '@/lib/roleContext'

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
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
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
        fontSize: '16px', fontWeight: 700, color: '#0f2d6e',
        fontFamily: 'Georgia, serif', textDecoration: 'none',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        <span style={{color: '#0a1f4e'}}>Elimu</span><span style={{color: '#8d7022'}}> Pay</span>
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
            color: pathname === href ? '#0a1f4e' : '#64748b',
            fontWeight: pathname === href ? 700 : 400,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            borderBottom: pathname === href ? '2px solid #c8a84b' : '2px solid transparent',
            padding: '2px 0',
          }}>
            {label}
          </Link>
        ))}

        {showRoleBadge && (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: '#64748b',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {ROLE_LABELS[role] ?? role}
          </span>
        )}

        <div style={{flexShrink: 0}}>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
