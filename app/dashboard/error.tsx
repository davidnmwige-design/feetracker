'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      background: 'var(--ep-bg-secondary)', minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '24px',
    }}>
      <div style={{
        background: 'var(--ep-card-bg)', borderRadius: '10px', border: '1px solid var(--ep-border)',
        padding: '40px 32px', maxWidth: '480px', width: '100%', textAlign: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', background: '#fcebeb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '22px',
        }}>!</div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '8px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--ep-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          The dashboard couldn&apos;t load. This is usually a temporary issue. Please try again.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#0a1f4e', color: '#fff', border: 'none', padding: '10px 24px',
              borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/login"
            style={{
              background: 'none', color: 'var(--ep-text-secondary)', border: '1px solid var(--ep-border)',
              padding: '10px 24px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none',
            }}
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  )
}
