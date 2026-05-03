import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FeeTracker',
  description: 'School fee management for Nairobi schools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-green-700 text-lg">
            FeeTracker
          </Link>
          <div className="flex items-center gap-6">
  <Link href="/dashboard" className="text-sm text-gray-600 hover:text-green-700">
    Dashboard
  </Link>
  <Link href="/students" className="text-sm text-gray-600 hover:text-green-700">
    Students
  </Link>
  <Link href="/upload" className="text-sm text-gray-600 hover:text-green-700">
    Upload MPESA
  </Link>
  <Link href="/reminders" className="text-sm text-gray-600 hover:text-green-700">
    Reminders
  </Link>
  <LogoutButton />
</div>
        </nav>
        {children}
      </body>
    </html>
  )
}