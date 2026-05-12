'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function AppNav() {
  const pathname = usePathname()
  const hideNav = ['/', '/login', '/signup', '/admin'].includes(pathname)

  if (hideNav) return null

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
        Fee<span style={{color: '#c8a84b'}}>Tracker</span>
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
        {[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/students', label: 'Students' },
          { href: '/invoices', label: 'Invoices' },
          { href: '/reminders', label: 'Reminders' },
          { href: '/upload', label: 'Upload' },
          { href: '/unmatched', label: 'Unmatched' },
          { href: '/reports', label: 'Reports' },
          { href: '/settings', label: 'Settings' },
        ].map(({ href, label }) => (
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
        <div style={{flexShrink: 0}}>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
