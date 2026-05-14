import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AppNav from '@/components/AppNav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Elimu Pay - School Fee Management',
  description: 'Elimu Pay - Smart school fee management for Kenyan schools. Automate MPESA payments, send instant parent notifications, and track fee collection in real time.',
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