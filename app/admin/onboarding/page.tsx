'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const STEP_LABELS: Record<string, string> = {
  accountCreated: 'Account created',
  studentsUploaded: 'Students uploaded',
  paybillConfigured: 'Paybill configured',
  invoiceSent: 'First invoice sent',
  statementUploaded: 'Statement uploaded',
}

const GROUPS = [
  { key: 'done', label: 'Fully set up', min: 5, max: 5, color: '#16a34a', bg: '#dcfce7' },
  { key: 'almost', label: 'Almost there', min: 3, max: 4, color: '#d97706', bg: '#fef3c7' },
  { key: 'started', label: 'Getting started', min: 1, max: 2, color: '#2563eb', bg: '#dbeafe' },
  { key: 'none', label: 'Not started', min: 0, max: 0, color: '#dc2626', bg: '#fee2e2' },
]

export default function AdminOnboarding() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState<Record<number, boolean>>({})
  const [reminderResult, setReminderResult] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch('/api/admin/onboarding').then(r => r.json()).then(d => { setSchools(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  async function sendReminder(schoolId: number) {
    setSendingReminder(prev => ({ ...prev, [schoolId]: true }))
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      })
      const data = await res.json()
      setReminderResult(prev => ({ ...prev, [schoolId]: res.ok ? '✓ Reminder sent' : (data.error || 'Failed') }))
    } catch { setReminderResult(prev => ({ ...prev, [schoolId]: 'Failed' })) }
    setSendingReminder(prev => ({ ...prev, [schoolId]: false }))
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Onboarding Tracker</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Track setup progress for all schools</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {GROUPS.map(g => {
            const count = schools.filter(s => s.completedSteps >= g.min && s.completedSteps <= g.max).length
            return (
              <div key={g.key} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: `4px solid ${g.color}` }}>
                <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{g.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: g.color, margin: 0 }}>{count}</p>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>Loading…</div>
      ) : (
        GROUPS.map(group => {
          const groupSchools = schools.filter(s => s.completedSteps >= group.min && s.completedSteps <= group.max)
          if (groupSchools.length === 0) return null
          return (
            <div key={group.key} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ background: group.bg, color: group.color, fontSize: '12px', fontWeight: 700, padding: '3px 12px', borderRadius: '999px' }}>{group.label}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{groupSchools.length} school{groupSchools.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groupSchools.map(school => (
                  <div key={school.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <Link href={`/admin/schools/${school.id}`} style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>{school.name}</Link>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{school.user?.name} · {school.user?.email}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {school.completedSteps < 5 && (
                          <>
                            {reminderResult[school.id] ? (
                              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>{reminderResult[school.id]}</span>
                            ) : (
                              <button onClick={() => sendReminder(school.id)} disabled={sendingReminder[school.id]}
                                style={{ background: '#f8f9fc', color: '#0a1f4e', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                {sendingReminder[school.id] ? 'Sending…' : 'Send reminder'}
                              </button>
                            )}
                          </>
                        )}
                        <span style={{ background: group.bg, color: group.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                          {school.completedSteps}/5
                        </span>
                      </div>
                    </div>

                    {/* Step indicators */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Object.entries(school.steps || {}).map(([key, done]) => (
                        <span key={key} style={{
                          fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                          background: done ? '#dcfce7' : '#f1f5f9',
                          color: done ? '#166534' : '#94a3b8',
                          fontWeight: done ? 700 : 400,
                        }}>
                          {done ? '✓' : '○'} {STEP_LABELS[key]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
