'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit() {
    if (!form.email || !form.password) return
    setLoading(true)
    setError('')

    try {
      // Check if this user has 2FA enabled before attempting sign-in
      const check = await fetch(`/api/auth/check-2fa-required?email=${encodeURIComponent(form.email)}`)
      const { required } = await check.json()

      if (required) {
        // Don't create a session yet — store credentials and redirect to 2FA page
        sessionStorage.setItem('ep_2fa_email', form.email)
        sessionStorage.setItem('ep_2fa_password', form.password)
        router.push('/verify-2fa')
        return
      }

      // No 2FA — complete login normally
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '16px'}}>
      <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '380px', overflow: 'hidden'}}>
        <div style={{background: '#0a1f4e', padding: '28px 32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0}}><span style={{color: '#fff'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span></h1>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px'}}>Sign in to your account</p>
        </div>

        <div style={{padding: '32px'}}>
          {registered && (
            <div style={{background: '#f0f4f9', border: '1px solid #c8d8f0', color: '#0a1f4e', fontSize: '13px', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
              Account created! Sign in to get started.
            </div>
          )}

          {error && (
            <div style={{background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '13px', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
              {error}
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div>
              <label htmlFor="email" style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div>
              <label htmlFor="password" style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Password</label>
              <div style={{position: 'relative'}}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  style={{paddingRight: '40px'}}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '2px'}}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !form.email || !form.password}
              style={{
                background: (loading || !form.email || !form.password) ? '#94a3b8' : '#0a1f4e',
                color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: (loading || !form.email || !form.password) ? 'not-allowed' : 'pointer', width: '100%'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <Link href="/forgot-password" style={{fontSize: '12px', color: '#64748b', textDecoration: 'none'}}>
                Forgot password?
              </Link>
              <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>
                No account?{' '}
                <Link href="/signup" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>
                  Set up your school
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
