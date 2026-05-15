'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'ep_onboarding_dismissed'

interface Step {
  id: number
  label: string
  complete: boolean
  action: string | null
}

const ACTION_LABELS: Record<string, string> = {
  '/settings':  'Configure in Settings',
  '/students':  'Upload students',
  '/upload':    'Upload statement',
  '/invoices':  'Send invoice',
}

export default function OnboardingChecklist() {
  const [steps, setSteps] = useState<Step[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [allComplete, setAllComplete] = useState(false)
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISS_KEY) === '1'
    if (isDismissed) { setLoaded(true); return }

    fetch('/api/onboarding/status')
      .then(r => r.json())
      .then(data => {
        if (!data.steps) return
        setSteps(data.steps)
        setCompletedCount(data.completedCount)
        setAllComplete(data.allComplete)
        setDismissed(false)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (!loaded || dismissed) return null

  const pct = Math.round((completedCount / 5) * 100)

  if (allComplete) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#166534', margin: '0 0 2px' }}>Setup complete! Your school is ready to collect fees.</p>
          <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>All 5 setup steps completed.</p>
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#0a1f4e', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Getting started with Elimu Pay</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: '999px', height: '6px', width: '200px' }}>
              <div style={{ height: '100%', borderRadius: '999px', background: '#c8a84b', width: pct + '%', transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#c8a84b', fontWeight: 600 }}>{completedCount}/5 complete</span>
          </div>
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>
          Dismiss
        </button>
      </div>

      {/* Steps */}
      <div style={{ padding: '4px 0' }}>
        {steps.map((step, i) => (
          <div key={step.id} style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '12px 20px',
            borderBottom: i < steps.length - 1 ? '1px solid #f1f5f9' : 'none',
            background: step.complete ? '#fafbfc' : '#fff',
          }}>
            {/* Icon */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step.complete ? '#dcfce7' : '#0a1f4e',
              border: step.complete ? '1px solid #bbf7d0' : 'none',
            }}>
              {step.complete
                ? <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: 700 }}>&#10003;</span>
                : <span style={{ color: '#c8a84b', fontSize: '12px', fontWeight: 700 }}>{step.id}</span>
              }
            </div>

            {/* Label */}
            <span style={{
              flex: 1, fontSize: '13px', fontWeight: step.complete ? 400 : 600,
              color: step.complete ? '#94a3b8' : '#0f172a',
              textDecoration: step.complete ? 'line-through' : 'none',
            }}>
              {step.label}
            </span>

            {/* Action button */}
            {!step.complete && step.action && (
              <Link href={step.action} style={{
                fontSize: '11px', fontWeight: 700, color: '#0a1f4e',
                background: '#c8a84b', padding: '5px 12px', borderRadius: '5px',
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {ACTION_LABELS[step.action] ?? 'Go'}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
