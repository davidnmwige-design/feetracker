'use client'
import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export default function CrispChat() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID

    const s = document.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = true
    document.head.appendChild(s)

    return () => {
      try {
        if (window.$crisp && Array.isArray(window.$crisp)) {
          window.$crisp.push(['do', 'chat:hide'])
        }
      } catch { /* ignore */ }
    }
  }, [])

  return null
}
