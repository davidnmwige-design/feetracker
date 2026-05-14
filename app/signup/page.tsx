'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: met ? '#0a7c4e' : '#94a3b8'}}>
      <span style={{fontWeight: 700}}>{met ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  )
}

function checkPassword(p: string) {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
  }
}

export default function Signup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    paybill: '',
    term: 'Term 2 2026'
  })

  const rules = checkPassword(form.password)
  const passwordValid = rules.length && rules.upper && rules.lower && rules.number
  const passwordsMatch = form.password.length > 0 && confirmPassword === form.password

  async function handleSubmit() {
    if (!passwordValid) {
      setError('Password does not meet the requirements')
      return
    }
    if (!agreedToPolicy) {
      setError('You must agree to the Privacy Policy to continue')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/login?registered=true')
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '440px', overflow: 'hidden'}}>
        <div style={{background: '#0a1f4e', padding: '28px 32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0}}><span style={{color: '#fff'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span></h1>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px'}}>Create your account — 30 days free</p>
        </div>

        <div style={{padding: '32px'}}>
          {error && (
            <div style={{background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '13px', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
              {error}
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
            <div>
              <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Your name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="e.g. John Kamau"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Email address</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="e.g. john@stmarys.ac.ke"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Password</label>
              <div style={{position: 'relative'}}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  style={{paddingRight: '40px'}}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '2px'}}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '10px', background: '#f8f9fc', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                  <PasswordRule met={rules.length} label="8+ characters" />
                  <PasswordRule met={rules.upper} label="Uppercase letter" />
                  <PasswordRule met={rules.lower} label="Lowercase letter" />
                  <PasswordRule met={rules.number} label="Number" />
                </div>
              )}
            </div>

            <div>
              <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Confirm password</label>
              <div style={{position: 'relative'}}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  style={{paddingRight: '40px'}}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '2px'}}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div style={{marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'}}>
                  {passwordsMatch
                    ? <><span style={{color: '#0a7c4e', fontWeight: 700}}>✓</span><span style={{color: '#0a7c4e'}}>Passwords match</span></>
                    : <><span style={{color: '#e24b4a', fontWeight: 700}}>✗</span><span style={{color: '#e24b4a'}}>Passwords do not match</span></>
                  }
                </div>
              )}
            </div>

            <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '16px'}}>
              <p style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '14px'}}>School details</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>School name</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="e.g. St. Mary's Academy"
                    value={form.schoolName}
                    onChange={e => setForm({ ...form, schoolName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>MPESA Paybill / Till number</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="e.g. 123456"
                    value={form.paybill}
                    onChange={e => setForm({ ...form, paybill: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Current term</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    value={form.term}
                    onChange={e => setForm({ ...form, term: e.target.value })}
                  >
                    <option>Term 1 2026</option>
                    <option>Term 2 2026</option>
                    <option>Term 3 2026</option>
                  </select>
                </div>
              </div>
            </div>

            <label style={{display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '4px'}}>
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                style={{marginTop: '2px', accentColor: '#0a1f4e', flexShrink: 0}}
              />
              <span style={{fontSize: '12px', color: '#64748b', lineHeight: '1.5'}}>
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email || !form.password || !form.schoolName || !passwordValid || !passwordsMatch || !agreedToPolicy}
              style={{
                background: (loading || !form.name || !form.email || !form.password || !form.schoolName || !passwordValid || !passwordsMatch || !agreedToPolicy) ? '#94a3b8' : '#0a1f4e',
                color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: 'pointer', width: '100%', marginTop: '4px'
              }}
            >
              {loading ? 'Creating account...' : 'Start free trial'}
            </button>

            <p style={{textAlign: 'center', fontSize: '12px', color: '#64748b'}}>
              Already have an account?{' '}
              <Link href="/login" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
