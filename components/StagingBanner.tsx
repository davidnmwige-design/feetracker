export default function StagingBanner() {
  if (
    process.env.NEXT_PUBLIC_APP_URL?.includes('staging') ||
    process.env.NEXT_PUBLIC_IS_STAGING === 'true'
  ) {
    return (
      <div style={{
        background: '#e24b4a',
        color: '#fff',
        textAlign: 'center',
        padding: '8px',
        fontSize: '13px',
        fontWeight: 600,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}>
        STAGING ENVIRONMENT — This is not the live site. Data may be reset at any time.
      </div>
    )
  }
  return null
}
