'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/dashboard',  label: 'Dashboard',     icon: '▦' },
  { href: '/admin/schools',    label: 'Schools',        icon: '⊡' },
  { href: '/admin/billing',    label: 'Billing',        icon: '◈' },
  { href: '/admin/analytics',  label: 'Analytics',      icon: '◫' },
  { href: '/admin/flags',      label: 'Support Flags',  icon: '⚑' },
  { href: '/admin/activity',   label: 'Activity Feed',  icon: '◎' },
  { href: '/admin/audit',      label: 'Audit Log',      icon: '≡' },
  { href: '/admin/settings',   label: 'Admin Settings', icon: '⚙' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminName, setAdminName] = useState('')
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Skip layout for setup page
  const isSetupPage = pathname === '/admin'

  useEffect(() => {
    if (isSetupPage) { setChecked(true); return }
    fetch('/api/admin/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.name) setAdminName(data.name)
        else router.push('/login')
        setChecked(true)
      })
      .catch(() => { router.push('/login'); setChecked(true) })
  }, [isSetupPage])

  if (isSetupPage) return <>{children}</>
  if (!checked) return (
    <div style={{ minHeight: '100vh', background: '#050f2c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4a6096', fontSize: '13px' }}>Loading admin panel…</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%) !important; }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-mobile-btn { display: flex !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside className={'admin-sidebar' + (sidebarOpen ? ' open' : '')} style={{
        width: '220px', flexShrink: 0, background: '#050f2c',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s',
      }}>
        <div style={{ padding: '22px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: '#c8a84b', fontSize: '16px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>FeeTracker</p>
          <p style={{ color: '#3a5280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '4px 0 0' }}>Admin Panel</p>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin/dashboard')
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '6px', marginBottom: '2px',
                color: active ? '#fff' : '#5a7ab0',
                background: active ? 'rgba(200,168,75,0.14)' : 'transparent',
                textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid #c8a84b' : '3px solid transparent',
              }}>
                <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {adminName && <p style={{ color: '#5a7ab0', fontSize: '11px', margin: '0 0 10px', fontWeight: 600 }}>{adminName}</p>}
          <Link href="/login" style={{ color: '#3a5280', fontSize: '12px', textDecoration: 'none' }}>
            ← Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main" style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="admin-mobile-btn" onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px', padding: 0 }}>
              ☰
            </button>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#050f2c' }}>FeeTracker Admin</span>
          </div>
          {adminName && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {adminName}
            </span>
          )}
        </header>

        <main style={{ flex: 1, background: '#f1f4f9', padding: '24px', minHeight: 'calc(100vh - 49px)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
