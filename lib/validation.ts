import { sanitizeName } from './sanitize'

export const MAX_JSON_PAYLOAD = 10 * 1024 // 10 KB

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: any
}

export function validateEmail(email: unknown): ValidationResult {
  if (!email || typeof email !== 'string') return { valid: false, error: 'Email is required' }
  const trimmed = email.trim().toLowerCase()
  if (trimmed.length > 254) return { valid: false, error: 'Email address is too long' }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(trimmed)) return { valid: false, error: 'Invalid email address format' }
  return { valid: true, sanitized: trimmed }
}

export function validatePassword(password: unknown): ValidationResult {
  if (!password || typeof password !== 'string') return { valid: false, error: 'Password is required' }
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' }
  if (password.length > 128) return { valid: false, error: 'Password must not exceed 128 characters' }
  return { valid: true, sanitized: password }
}

export function validateName(name: unknown, fieldName = 'Name', maxLength = 120): ValidationResult {
  if (!name || typeof name !== 'string') return { valid: false, error: `${fieldName} is required` }
  const sanitized = sanitizeName(name)
  if (sanitized.length === 0) return { valid: false, error: `${fieldName} cannot be empty` }
  if (sanitized.length > maxLength) return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` }
  return { valid: true, sanitized }
}

export function validatePhone(phone: unknown): ValidationResult {
  if (!phone) return { valid: true, sanitized: null }
  if (typeof phone !== 'string') return { valid: false, error: 'Invalid phone number' }
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  if (cleaned.length < 9 || cleaned.length > 15) return { valid: false, error: 'Phone number must be between 9 and 15 digits' }
  if (!/^\d+$/.test(cleaned)) return { valid: false, error: 'Phone number must contain only digits' }
  return { valid: true, sanitized: phone.trim() }
}

export function validatePaybill(paybill: unknown): ValidationResult {
  if (!paybill) return { valid: true, sanitized: null }
  if (typeof paybill !== 'string') return { valid: false, error: 'Invalid paybill' }
  const cleaned = paybill.trim()
  if (!/^\d{5,7}$/.test(cleaned)) return { valid: false, error: 'Paybill must be 5 to 7 digits' }
  return { valid: true, sanitized: cleaned }
}

export function validateAmount(amount: unknown, fieldName = 'Amount'): ValidationResult {
  if (amount === null || amount === undefined) return { valid: false, error: `${fieldName} is required` }
  const num = Number(amount)
  if (isNaN(num)) return { valid: false, error: `${fieldName} must be a number` }
  if (num < 0) return { valid: false, error: `${fieldName} cannot be negative` }
  if (num > 10_000_000) return { valid: false, error: `${fieldName} exceeds maximum allowed value` }
  return { valid: true, sanitized: num }
}

export function validateUrl(url: unknown): ValidationResult {
  if (!url) return { valid: true, sanitized: null }
  if (typeof url !== 'string') return { valid: false, error: 'Invalid URL' }
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, error: 'URL must use http or https' }
    return { valid: true, sanitized: url.trim() }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

export function validateHexColor(color: unknown): ValidationResult {
  if (!color) return { valid: true, sanitized: null }
  if (typeof color !== 'string') return { valid: false, error: 'Invalid color' }
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return { valid: false, error: 'Color must be a valid hex value like #0a1f4e' }
  return { valid: true, sanitized: color.toUpperCase() }
}

export function validateInt(value: unknown, fieldName = 'Value', min?: number, max?: number): ValidationResult {
  if (value === null || value === undefined) return { valid: false, error: `${fieldName} is required` }
  const num = parseInt(String(value), 10)
  if (isNaN(num)) return { valid: false, error: `${fieldName} must be a whole number` }
  if (min !== undefined && num < min) return { valid: false, error: `${fieldName} must be at least ${min}` }
  if (max !== undefined && num > max) return { valid: false, error: `${fieldName} must not exceed ${max}` }
  return { valid: true, sanitized: num }
}

export function validateEnum(value: unknown, allowed: string[], fieldName = 'Value'): ValidationResult {
  if (!value || typeof value !== 'string') return { valid: false, error: `${fieldName} is required` }
  if (!allowed.includes(value)) return { valid: false, error: `${fieldName} must be one of: ${allowed.join(', ')}` }
  return { valid: true, sanitized: value }
}

export function validateText(text: unknown, fieldName = 'Text', maxLength = 500, required = false): ValidationResult {
  if (!text || typeof text !== 'string') {
    if (required) return { valid: false, error: `${fieldName} is required` }
    return { valid: true, sanitized: null }
  }
  const trimmed = text.trim()
  if (trimmed.length > maxLength) return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` }
  return { valid: true, sanitized: trimmed.replace(/<[^>]*>/g, '') }
}

export async function checkPayloadSize(request: Request, maxBytes = MAX_JSON_PAYLOAD): Promise<ValidationResult> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return { valid: false, error: `Request payload too large. Maximum size is ${Math.round(maxBytes / 1024)}KB` }
  }
  return { valid: true }
}
