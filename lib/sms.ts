// SMS gateway — Celcom Africa adapter.
//
// Provider-agnostic surface (sendSms / sendBulkSms) so the gateway can be swapped later. Reads config
// from env and degrades gracefully (returns { ok:false } without throwing) when not configured, so the
// rest of the app keeps working in dev / before credentials are set.
//
// Celcom Africa bulk-SMS HTTP API:
//   single: POST {BASE}/sendsms/   body { apikey, partnerID, message, shortcode, mobile }
//   bulk:   POST {BASE}/sendbulk/  body { count, smslist: [{ partnerID, apikey, mobile, message, shortcode, pass_type, clientsmsid }] }
//   success response item: { "response-code": 200, "messageid": ..., "mobile": ... }

import { normalizePhoneForWhatsApp } from '@/lib/phoneUtils'

const BASE = (process.env.CELCOM_API_URL || 'https://isms.celcomafrica.com/api/services').replace(/\/$/, '')
const API_KEY = process.env.CELCOM_API_KEY || ''
const PARTNER_ID = process.env.CELCOM_PARTNER_ID || ''
const SHORTCODE = process.env.CELCOM_SHORTCODE || '' // registered sender ID

export interface SmsResult { ok: boolean; mobile: string; messageId?: string; error?: string }

export function smsConfigured(): boolean {
  return Boolean(API_KEY && PARTNER_ID && SHORTCODE)
}

// Celcom expects MSISDN as 2547XXXXXXXX (no leading +). The WhatsApp normaliser already yields 254… digits.
export function toMsisdn(phone: string | null | undefined): string {
  return phone ? normalizePhoneForWhatsApp(phone) : ''
}

function isSuccess(httpOk: boolean, item: Record<string, unknown> | undefined): boolean {
  if (!httpOk || !item) return false
  const code = Number(item['response-code'] ?? (item as Record<string, unknown>).responsecode)
  return code === 200 || code === 1000 || code === 1001 || Boolean(item.messageid)
}

function errOf(item: Record<string, unknown> | undefined, status: number): string {
  return String(item?.['response-description'] ?? `HTTP ${status}`)
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const mobile = toMsisdn(to)
  if (!smsConfigured()) return { ok: false, mobile, error: 'SMS not configured' }
  if (mobile.length < 12) return { ok: false, mobile, error: 'Invalid phone number' }
  try {
    const res = await fetch(`${BASE}/sendsms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: API_KEY, partnerID: PARTNER_ID, message, shortcode: SHORTCODE, mobile }),
    })
    const data = await res.json().catch(() => ({}))
    const item = Array.isArray(data?.responses) ? data.responses[0] : data
    return isSuccess(res.ok, item)
      ? { ok: true, mobile, messageId: String(item?.messageid ?? '') }
      : { ok: false, mobile, error: errOf(item, res.status) }
  } catch (e) {
    return { ok: false, mobile, error: e instanceof Error ? e.message : 'Network error' }
  }
}

export async function sendBulkSms(items: { to: string; message: string }[]): Promise<SmsResult[]> {
  const smslist = items.map((i, idx) => ({
    partnerID: PARTNER_ID, apikey: API_KEY, mobile: toMsisdn(i.to), message: i.message,
    shortcode: SHORTCODE, pass_type: 'plain', clientsmsid: idx + 1,
  }))
  if (!smsConfigured()) return smslist.map(s => ({ ok: false, mobile: s.mobile, error: 'SMS not configured' }))
  try {
    const res = await fetch(`${BASE}/sendbulk/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: smslist.length, smslist }),
    })
    const data = await res.json().catch(() => ({}))
    const responses: Record<string, unknown>[] = Array.isArray(data?.responses) ? data.responses : []
    return smslist.map((s, idx) => {
      const item = responses[idx] ?? responses.find(r => String(r?.mobile) === s.mobile)
      return isSuccess(res.ok, item)
        ? { ok: true, mobile: s.mobile, messageId: String(item?.messageid ?? '') }
        : { ok: false, mobile: s.mobile, error: errOf(item, res.status) }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return smslist.map(s => ({ ok: false, mobile: s.mobile, error: msg }))
  }
}

// Concise reminder SMS — built server-side from DB data (no client-supplied content).
export function reminderSmsText(
  school: { name: string; paybill?: string | null; accountNumberFormat?: string | null },
  student: { name: string; class: string; stream?: string | null; parentName?: string | null },
  balance: number,
): string {
  const cls = `${student.class}${student.stream ? ' ' + student.stream : ''}`
  let msg = `Dear ${student.parentName || 'Parent'}, ${student.name} (${cls}) has an outstanding fee balance of KES ${balance.toLocaleString()}.`
  if (school.paybill) msg += ` Pay via M-PESA Paybill ${school.paybill}${school.accountNumberFormat ? ', Acc ' + school.accountNumberFormat : ''}.`
  msg += ` - ${school.name}`
  return msg
}
