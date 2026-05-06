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
