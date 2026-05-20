'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import zxcvbn from 'zxcvbn'
import { formatBreachMessage } from '@/lib/hibpMessages'

async function sha1Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: met ? '#0a7c4e' : '#94a3b8'}}>
      <span style={{fontWeight: 700}}>{met ? 'Yes' : 'No'}</span>
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
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    paybill: '',
    term: 'Term 2 2026'
  })

  const [breachStatus, setBreachStatus] = useState<'unchecked' | 'checking' | 'safe' | 'breached'>('unchecked')
  const [breachCount, setBreachCount] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkBreach = useCallback((pwd: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (pwd.length < 8) { setBreachStatus('unchecked'); return }
    setBreachStatus('checking')
    debounceTimer.current = setTimeout(async () => {
      try {
        const hash = await sha1Hash(pwd)
        const prefix = hash.substring(0, 5).toUpperCase()
        const suffix = hash.substring(5).toUpperCase()
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
          headers: { 'User-Agent': 'Elimu-Pay-Password-Check' },
        })
        if (!res.ok) { setBreachStatus('unchecked'); return }
        const text = await res.text()
        for (const line of text.split('\n')) {
          const [hashSuffix, countStr] = line.split(':')
          if (hashSuffix.trim().toUpperCase() === suffix) {
            setBreachStatus('breached')
            setBreachCount(parseInt(countStr.trim(), 10))
            return
          }
        }
        setBreachStatus('safe')
      } catch {
        setBreachStatus('unchecked')
      }
    }, 800)
  }, [])

  const rules = checkPassword(form.password)
  const passwordRulesOk = rules.length && rules.upper && rules.lower && rules.number && passwordStrength >= 2
  const passwordValid = passwordRulesOk && breachStatus !== 'breached'
  const passwordsMatch = form.password.length > 0 && confirmPassword === form.password

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][passwordStrength] || ''
  const strengthColor = passwordStrength <= 1 ? '#e24b4a' : passwordStrength === 2 ? '#c8a84b' : '#0f6e56'

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

    // Try to sign in with the credentials just submitted
    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.error) {
      // signIn failed — the email already exists with a different password
      router.push('/login?message=account-exists')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main style={{background: 'var(--ep-bg-secondary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: 'var(--ep-card-bg)', borderRadius: '10px', border: '1px solid var(--ep-border)', width: '100%', maxWidth: '440px', overflow: 'hidden'}}>
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
              <label htmlFor="name" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="e.g. John Kamau"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="e.g. john@stmarys.ac.ke"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Password</label>
              <div style={{position: 'relative'}}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  style={{paddingRight: '40px'}}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => {
                    const val = e.target.value
                    setForm({ ...form, password: val })
                    setPasswordStrength(val ? zxcvbn(val).score : 0)
                    checkBreach(val)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ep-text-tertiary)', fontSize: '12px', padding: '2px'}}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '10px', background: 'var(--ep-bg-secondary)', borderRadius: '6px', border: '1px solid var(--ep-border)'}}>
                  <PasswordRule met={rules.length} label="8+ characters" />
                  <PasswordRule met={rules.upper} label="Uppercase letter" />
                  <PasswordRule met={rules.lower} label="Lowercase letter" />
                  <PasswordRule met={rules.number} label="Number" />
                  <div style={{gridColumn: '1/-1', marginTop: '8px'}}>
                    <div style={{display: 'flex', gap: '4px', marginBottom: '4px'}}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{height: '4px', flex: 1, borderRadius: '2px', background: i < passwordStrength ? strengthColor : '#e2e8f0'}} />
                      ))}
                    </div>
                    <p style={{fontSize: '11px', color: strengthColor, margin: 0, fontWeight: 600}}>{strengthLabel}</p>
                  </div>
                </div>
              )}
              {breachStatus === 'checking' && (
                <p style={{fontSize: '11px', color: 'var(--ep-text-secondary)', marginTop: '4px'}}>Checking password security...</p>
              )}
              {breachStatus === 'safe' && (
                <p style={{fontSize: '11px', color: '#0f6e56', marginTop: '4px'}}>Password not found in any known data breaches.</p>
              )}
              {breachStatus === 'breached' && (
                <p style={{fontSize: '11px', color: '#e24b4a', marginTop: '4px'}}>{formatBreachMessage(breachCount)}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Confirm password</label>
              <div style={{position: 'relative'}}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  style={{paddingRight: '40px'}}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ep-text-tertiary)', fontSize: '12px', padding: '2px'}}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div style={{marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'}}>
                  {passwordsMatch
                    ? <><span style={{color: '#0a7c4e'}}>Passwords match</span></>
                    : <><span style={{color: '#e24b4a'}}>Passwords do not match</span></>
                  }
                </div>
              )}
            </div>

            <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '16px'}}>
              <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '14px'}}>School details</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <div>
                  <label htmlFor="schoolName" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>School name</label>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    autoComplete="organization"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="e.g. St. Mary's Academy"
                    value={form.schoolName}
                    onChange={e => setForm({ ...form, schoolName: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="paybill" style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>MPESA Paybill / Till number</label>
                  <input
                    id="paybill"
                    name="paybill"
                    type="text"
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="e.g. 123456"
                    value={form.paybill}
                    onChange={e => setForm({ ...form, paybill: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="term" className="text-sm font-medium text-gray-700 block mb-1">Current term</label>
                  <select
                    id="term"
                    name="term"
                    aria-label="Current term"
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
              <span style={{fontSize: '12px', color: 'var(--ep-text-secondary)', lineHeight: '1.5'}}>
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email || !form.password || !form.schoolName || !passwordValid || !passwordsMatch || !agreedToPolicy || breachStatus === 'checking'}
              style={{
                background: (loading || !form.name || !form.email || !form.password || !form.schoolName || !passwordValid || !passwordsMatch || !agreedToPolicy || breachStatus === 'checking') ? '#94a3b8' : '#0a1f4e',
                color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: 'pointer', width: '100%', marginTop: '4px'
              }}
            >
              {loading ? 'Creating account...' : 'Start free trial'}
            </button>

            <p style={{textAlign: 'center', fontSize: '12px', color: 'var(--ep-text-secondary)'}}>
              Already have an account?{' '}
              <Link href="/login" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
