interface StudentAvatarProps {
  name: string
  photoUrl?: string | null
  size?: number
}

export default function StudentAvatar({ name, photoUrl, size = 40 }: StudentAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #e2e8f0',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#0a1f4e',
      color: '#c8a84b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.35),
      fontWeight: 700,
      flexShrink: 0,
      fontFamily: 'Arial, sans-serif',
    }}>
      {initials}
    </div>
  )
}
