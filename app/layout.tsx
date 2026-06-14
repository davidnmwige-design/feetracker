import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import AppNav from '@/components/AppNav'
import StagingBanner from '@/components/StagingBanner'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PlausibleAnalytics from '@/components/PlausibleAnalytics'
import CrispChat from '@/components/CrispChat'
import SessionRefreshHandler from '@/components/SessionRefreshHandler'

const geist = localFont({
  src: [
    { path: '../public/fonts/geist-latin.woff2', weight: '100 900', style: 'normal' },
    { path: '../public/fonts/geist-latin-ext.woff2', weight: '100 900', style: 'normal' },
  ],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://elimupay.co.ke'

export const metadata: Metadata = {
  title: 'Elimu Pay - School Fee Management',
  description: 'Elimu Pay - Smart school fee management for Kenyan schools. Automate MPESA payments, send instant parent notifications, and track fee collection in real time.',
  manifest: '/manifest.json',
  alternates: {
    canonical: APP_URL,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Elimu Pay',
  },
}

export const viewport = {
  themeColor: '#0a1f4e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('ep-theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)})()` }} />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0a1f4e" />
        <PlausibleAnalytics />
      </head>
      <body className={geist.className}>
        <StagingBanner />
        <AppNav />
        {children}
        <PWAInstallPrompt />
        <CrispChat />
        <SessionRefreshHandler />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
        }} />
      </body>
    </html>
  )
}
