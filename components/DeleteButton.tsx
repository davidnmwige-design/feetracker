'use client'
import { useState } from 'react'

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void
  label?: string
  confirmText?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function DeleteButton({
  onDelete,
  label = 'Delete',
  confirmText = 'Confirm delete?',
  size = 'sm',
  disabled = false,
}: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const pad = size === 'sm' ? '3px 8px' : '6px 16px'
  const fs = size === 'sm' ? '11px' : '13px'

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
        <span style={{ fontSize: fs, color: '#a32d2d', whiteSpace: 'nowrap' }}>{confirmText}</span>
        <button
          onClick={handleConfirm}
          disabled={deleting}
          style={{
            fontSize: fs, background: '#a32d2d', color: '#fff', border: 'none',
            padding: pad, borderRadius: '4px', cursor: deleting ? 'not-allowed' : 'pointer',
            fontWeight: 700, whiteSpace: 'nowrap', opacity: deleting ? 0.7 : 1,
          }}
        >
          {deleting ? '…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          style={{
            fontSize: fs, background: 'none', border: '1px solid var(--ep-border)',
            padding: pad, borderRadius: '4px', cursor: 'pointer', color: 'var(--ep-text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={disabled}
      style={{
        fontSize: fs, color: '#a32d2d', background: 'none',
        border: '1px solid #f5c6c6', padding: pad, borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}
