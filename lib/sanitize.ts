export function sanitize(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/javascript:/gi, '')   // strip javascript: URIs
    .replace(/on\w+\s*=/gi, '')     // strip inline event handlers
    .replace(/\x00/g, '')           // strip null bytes
    .replace(/--/g, '')             // strip SQL comment sequences
    .trim()
    .slice(0, maxLength)
}

export function sanitizeName(value: string): string {
  if (!value) return ''
  let s = String(value).trim()
  s = s.replace(/^[=+\-@\t\r]+/, '')
  s = s.replace(/[\n\r\x00-\x1F\x7F]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > 80) s = s.substring(0, 80)
  return s
}
