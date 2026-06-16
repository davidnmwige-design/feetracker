import { describe, it, expect } from 'vitest'
import { smsConfigured, toMsisdn, sendSms, sendBulkSms, reminderSmsText } from '../lib/sms'

describe('sms adapter', () => {
  it('is not configured without Celcom credentials (so it never sends in dev/tests)', () => {
    expect(smsConfigured()).toBe(false)
  })

  it('normalizes Kenyan numbers to 2547XXXXXXXX', () => {
    expect(toMsisdn('0712345678')).toBe('254712345678')
    expect(toMsisdn('+254712345678')).toBe('254712345678')
    expect(toMsisdn('254712345678')).toBe('254712345678')
    expect(toMsisdn('254 712 345 678')).toBe('254712345678')
    expect(toMsisdn('')).toBe('')
  })

  it('returns a graceful "not configured" result without hitting the network', async () => {
    const one = await sendSms('0712345678', 'hi')
    expect(one).toMatchObject({ ok: false, error: 'SMS not configured' })

    const bulk = await sendBulkSms([{ to: '0712345678', message: 'hi' }])
    expect(bulk).toHaveLength(1)
    expect(bulk[0]).toMatchObject({ ok: false, mobile: '254712345678', error: 'SMS not configured' })
  })

  it('builds a concise reminder message with the paybill', () => {
    const msg = reminderSmsText(
      { name: 'Stress Academy', paybill: '555001', accountNumberFormat: 'ADM' },
      { name: 'Jane Doe', class: 'Grade 4', stream: 'A', parentName: 'Mary' },
      12500,
    )
    expect(msg).toContain('Jane Doe (Grade 4 A)')
    expect(msg).toContain('KES 12,500')
    expect(msg).toContain('Paybill 555001')
    expect(msg).toContain('- Stress Academy')
  })
})
