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
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '6px',
        padding: '5px 9px',
        cursor: 'pointer',
        color: '#94a3b8',
        fontSize: '12px',
        flexShrink: 0,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
