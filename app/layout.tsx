import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AppNav from '@/components/AppNav'

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
        <AppNav />
        {children}
      </body>
    </html>
  )
}