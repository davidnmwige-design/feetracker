'use client'
import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> })
      setTimeout(() => setShowPrompt(true), 30000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0a1f4e',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      maxWidth: '380px',
      width: 'calc(100vw - 40px)',
    }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
          Install Elimu Pay
        </p>
        <p style={{ fontSize: '12px', color: '#94a3c8', margin: 0 }}>
          Add to your home screen for quick access
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setShowPrompt(false)}
          style={{ background: 'transparent', color: '#94a3c8', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        >
          Not now
        </button>
        <button
          onClick={async () => {
            deferredPrompt.prompt()
            await deferredPrompt.userChoice
            setShowPrompt(false)
            setDeferredPrompt(null)
          }}
          style={{
            background: '#c8a84b',
            color: '#0a1f4e',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          Install
        </button>
      </div>
    </div>
  )
}
