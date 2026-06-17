import { describe, it, expect } from 'vitest'
import { stkConfigured, darajaTimestamp, stkPassword } from '../lib/daraja'

describe('daraja STK helpers', () => {
  it('is not configured without the passkey/shortcode (so it never initiates in dev/tests)', () => {
    expect(stkConfigured()).toBe(false)
  })

  it('formats the Daraja timestamp as YYYYMMDDHHmmss', () => {
    const ts = darajaTimestamp(new Date(2026, 5, 17, 9, 8, 7)) // 2026-06-17 09:08:07 local
    expect(ts).toBe('20260617090807')
    expect(ts).toMatch(/^\d{14}$/)
  })

  it('builds the STK password as base64(shortcode + passkey + timestamp)', () => {
    const pwd = stkPassword('174379', 'PASSKEY', '20260617090807')
    expect(pwd).toBe(Buffer.from('174379PASSKEY20260617090807').toString('base64'))
    // round-trips back to the concatenation
    expect(Buffer.from(pwd, 'base64').toString()).toBe('174379PASSKEY20260617090807')
  })
})
