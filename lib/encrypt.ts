import crypto from 'crypto'

const KEY_ENV = process.env.DATA_ENCRYPTION_KEY || ''
const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
  if (KEY_ENV.length < 32) return Buffer.alloc(32, 0)
  return Buffer.from(KEY_ENV.slice(0, 32), 'utf8')
}

// No-op if DATA_ENCRYPTION_KEY is not set (dev mode)
export function encrypt(text: string): string {
  if (KEY_ENV.length < 32) return text
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  if (KEY_ENV.length < 32) return text
  if (!text || !text.includes(':')) return text // plaintext (not yet encrypted)
  try {
    const [ivHex, encHex] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const encBuf = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    return Buffer.concat([decipher.update(encBuf), decipher.final()]).toString('utf8')
  } catch {
    return text // return as-is if decryption fails (e.g. key rotation)
  }
}
