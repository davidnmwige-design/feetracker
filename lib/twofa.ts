export const COOKIE_NAME = 'ft_2fa'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export async function create2faCookieValue(userId: number, secret: string): Promise<string> {
  const exp = Date.now() + MAX_AGE_MS
  const data = `${userId}:${exp}`
  const key = await getKey(secret)
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}:${toHex(sig)}`
}

export async function verify2faCookie(value: string | undefined, userId: number, secret: string): Promise<boolean> {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const [uid, exp, sig] = parts
  if (Number(uid) !== userId) return false
  if (Date.now() > Number(exp)) return false
  const data = `${uid}:${exp}`
  const key = await getKey(secret)
  try {
    return await globalThis.crypto.subtle.verify('HMAC', key, fromHex(sig), new TextEncoder().encode(data))
  } catch {
    return false
  }
}
