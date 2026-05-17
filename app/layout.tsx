import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AppNav from '@/components/AppNav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Elimu Pay - School Fee Management',
  description: 'Elimu Pay - Smart school fee management for Kenyan schools. Automate MPESA payments, send instant parent notifications, and track fee collection in real time.',
  manifest: '/manifest.json',
  themeColor: '#0a1f4e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Elimu Pay',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0a1f4e" />
      </head>
      <body className={geist.className}>
        <AppNav />
        {children}
      </body>
    </html>
  )
}
