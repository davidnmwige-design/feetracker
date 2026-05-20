export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1)
  // Strip ALL leading 254 prefixes (handles double-coded numbers like 254254700100001)
  while (cleaned.startsWith('254')) cleaned = cleaned.substring(3)
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
  return '254' + cleaned
}
