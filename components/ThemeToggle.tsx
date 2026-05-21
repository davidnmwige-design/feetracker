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

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      className="theme-toggle-fixed"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: isDark ? '#1e293b' : '#0a1f4e',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '24px',
        padding: '8px 14px 8px 10px',
        cursor: 'pointer',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'inline-flex',
        width: '28px',
        height: '16px',
        background: isDark ? '#c8a84b' : 'rgba(255,255,255,0.3)',
        borderRadius: '8px',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute',
          top: '2px',
          left: isDark ? '14px' : '2px',
          width: '12px',
          height: '12px',
          background: '#ffffff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </span>
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}
