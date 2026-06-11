import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '16px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <p style={{
          color: '#c8a84b',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          404
        </p>
        <h1 style={{ color: 'var(--ep-text-primary, #0a1f4e)', fontSize: '24px', margin: '8px 0 12px' }}>
          Page not found
        </h1>
        <p style={{
          color: 'var(--ep-text-secondary, #64748b)',
          fontSize: '14px',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          The page you are looking for doesn&rsquo;t exist or has moved.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#0a1f4e',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
