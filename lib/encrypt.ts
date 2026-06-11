import crypto from 'crypto'

const KEY_ENV = process.env.DATA_ENCRYPTION_KEY || ''
const GCM_ALGORITHM = 'aes-256-gcm'
const CBC_ALGORITHM = 'aes-256-cbc' // legacy — read-only, for decrypting pre-existing data

// Fail fast in production: never silently store sensitive fields (e.g. parentEmail) as plaintext.
if (process.env.NODE_ENV === 'production' && KEY_ENV.length < 32) {
  throw new Error(
    'DATA_ENCRYPTION_KEY must be set to at least 32 characters in production. ' +
      'Field-level encryption cannot run without it.'
  )
}

// 32 ASCII characters == 32 bytes == AES-256 key (matches the documented key format).
function getKey(): Buffer {
  return Buffer.from(KEY_ENV.slice(0, 32), 'utf8')
}

function keyAvailable(): boolean {
  return KEY_ENV.length >= 32
}

// Authenticated encryption (AES-256-GCM). Format: iv:authTag:ciphertext (all hex).
// No-op in development if no key is set (guarded against in production by the check above).
export function encrypt(text: string): string {
  if (!keyAvailable()) return text
  const iv = crypto.randomBytes(12) // 96-bit nonce, recommended for GCM
  const cipher = crypto.createCipheriv(GCM_ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  if (!keyAvailable()) return text
  if (!text || !text.includes(':')) return text // plaintext (not yet encrypted)

  const parts = text.split(':')
  try {
    if (parts.length === 3) {
      // Current AES-256-GCM format: iv:authTag:ciphertext — integrity-checked.
      const [ivHex, tagHex, encHex] = parts
      const decipher = crypto.createDecipheriv(GCM_ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
      return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
    }
    if (parts.length === 2) {
      // Legacy AES-256-CBC format: iv:ciphertext — kept so pre-existing rows still decrypt.
      const [ivHex, encHex] = parts
      const decipher = crypto.createDecipheriv(CBC_ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
      return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
    }
    return text
  } catch {
    // Tampered ciphertext, key rotation, or an unexpected format — return as-is rather than crash.
    return text
  }
}
