import crypto from 'crypto'

/**
 * Constant-time string comparison. Returns false for null/empty values or on a
 * length mismatch (length is not secret for the fixed-length tokens we compare).
 */
export function secureEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}
