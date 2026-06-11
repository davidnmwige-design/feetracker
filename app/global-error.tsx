'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Catches errors thrown in the root layout itself. It replaces the root layout, so it must
// render its own <html>/<body> and cannot rely on global CSS variables.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fc',
          fontFamily: 'Arial, sans-serif',
          padding: '16px',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}>
            <h2 style={{ color: '#0a1f4e', marginBottom: '12px', fontSize: '20px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>
              An unexpected error occurred. We have been notified and are looking into it.
              Please try again or contact support if the problem persists.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  background: '#0a1f4e',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Try again
              </button>
              <a
                href="mailto:support@elimupay.co.ke"
                style={{ color: '#0a1f4e', fontSize: '13px', alignSelf: 'center' }}
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
