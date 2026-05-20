'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('ep-theme') as 'light' | 'dark' | null
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(preferred)
    document.documentElement.setAttribute('data-theme', preferred)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('ep-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '20px',
        padding: '4px 12px 4px 8px',
        cursor: 'pointer',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      <span style={{
        display: 'inline-flex',
        width: '32px',
        height: '18px',
        background: theme === 'dark' ? '#c8a84b' : 'rgba(255,255,255,0.3)',
        borderRadius: '9px',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute',
          top: '2px',
          left: theme === 'dark' ? '16px' : '2px',
          width: '14px',
          height: '14px',
          background: '#ffffff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </span>
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  )
}
