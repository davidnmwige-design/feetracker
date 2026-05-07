'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function AppNav() {
  const pathname = usePathname()
  const hideNav = ['/', '/login', '/signup', '/admin'].includes(pathname)

  if (hideNav) return null

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" style={{fontSize: '18px', fontWeight: 700, color: '#0f2d6e', fontFamily: 'Georgia, serif', textDecoration: 'none'}}>
        Fee<span style={{color: '#c8a84b'}}>Tracker</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
        <Link href="/invoices" className="text-sm text-gray-600 hover:text-gray-900">Invoices</Link>
        <Link href="/reminders" className="text-sm text-gray-600 hover:text-gray-900">Reminders</Link>
        <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
        <LogoutButton />
      </div>
    </nav>
  )
}