'use client'
import { useState, useEffect } from 'react'

interface HealthData {
  status: string
  timestamp: string
  version: string
  database: { status: string; latencyMs: number }
  environment: string
  error?: string
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  async function checkHealth() {
    setLoading(true)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealth(data)
    } catch {
      setHealth({ status: 'unreachable', timestamp: new Date().toISOString(), version: '', database: { status: 'unknown', latencyMs: 0 }, environment: '' })
    }
    setLastChecked(new Date())
    setLoading(false)
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 60000)
    return () => clearInterval(interval)
  }, [])

  const isHealthy = health?.status === 'healthy'
  const statusColor = loading ? '#64748b' : isHealthy ? '#0a7c3e' : '#e24b4a'
  const statusBg = loading ? '#f1f5f9' : isHealthy ? '#e1f5ee' : '#fcebeb'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ep-bg-secondary)', fontFamily: 'Arial, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ background: '#0a1f4e', padding: '28px 32px', borderRadius: '10px 10px 0 0' }}>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>
            <span style={{ color: '#fff' }}>Elimu</span><span style={{ color: '#c8a84b' }}> Pay</span>
          </h1>
          <p style={{ color: '#94a3c8', fontSize: '13px', margin: '4px 0 0' }}>System Status</p>
        </div>

        <div style={{ background: 'var(--ep-card-bg)', border: '1px solid var(--ep-border)', padding: '28px 32px' }}>
          <div style={{ background: statusBg, border: `1px solid ${statusColor}30`, borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: statusColor, margin: 0 }}>
                {loading ? 'Checking...' : isHealthy ? 'All systems operational' : 'Service disruption detected'}
              </p>
              {lastChecked && (
                <p style={{ fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: '2px 0 0' }}>
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {health && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {[
                { label: 'API', value: health.status === 'healthy' ? 'Operational' : 'Down', ok: health.status === 'healthy' },
                { label: 'Database', value: health.database?.status === 'connected' ? `Connected (${health.database.latencyMs}ms)` : 'Unavailable', ok: health.database?.status === 'connected' },
                { label: 'Environment', value: health.environment || '—', ok: true },
                { label: 'Version', value: health.version || '—', ok: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--ep-border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--ep-text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: row.ok ? 'var(--ep-text-primary)' : '#e24b4a' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={checkHealth}
            disabled={loading}
            style={{ marginTop: '20px', background: loading ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        <div style={{ background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ep-text-tertiary)', fontSize: '11px', margin: 0 }}>
            Elimu Pay · <a href="mailto:support@elimupay.co.ke" style={{ color: '#8d7022' }}>support@elimupay.co.ke</a>
          </p>
        </div>
      </div>
    </div>
  )
}
