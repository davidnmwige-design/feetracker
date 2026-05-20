import crypto from 'crypto'

export function hashPhone(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') return null
  const key = process.env.DATA_ENCRYPTION_KEY || ''
  const normalized = phone.replace(/[\s\-\(\)\+]/g, '').toLowerCase()
  return crypto.createHash('sha256').update(normalized + key).digest('hex')
}
