import axios from 'axios'

const IS_SANDBOX = (process.env.DARAJA_ENV || 'sandbox') !== 'production'
const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke'

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getDarajaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const key = process.env.DARAJA_CONSUMER_KEY!
  const secret = process.env.DARAJA_CONSUMER_SECRET!
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')

  const res = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })

  cachedToken = res.data.access_token
  tokenExpiry = Date.now() + (Number(res.data.expires_in) - 60) * 1000
  return cachedToken!
}

// ─── STK Push (Lipa Na M-Pesa Online) ───────────────────────────────────────

export function stkConfigured(): boolean {
  return Boolean(
    process.env.DARAJA_CONSUMER_KEY &&
    process.env.DARAJA_CONSUMER_SECRET &&
    process.env.DARAJA_PASSKEY &&
    process.env.DARAJA_SHORTCODE,
  )
}

// Daraja timestamp: YYYYMMDDHHmmss in the server's local time.
export function darajaTimestamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

export interface StkPushParams {
  shortcode: string
  passkey: string
  amount: number
  phone: string // normalized to 2547XXXXXXXX
  callbackUrl: string
  accountReference: string
  description?: string
}

export interface StkPushResult {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResponseCode?: string
  ResponseDescription?: string
  CustomerMessage?: string
}

export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
  const token = await getDarajaToken()
  const timestamp = darajaTimestamp()
  const password = stkPassword(params.shortcode, params.passkey, timestamp)
  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: params.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: params.phone,
      PartyB: params.shortcode,
      PhoneNumber: params.phone,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: (params.description || 'Fee payment').slice(0, 13),
    },
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return res.data
}

export async function registerC2BUrls(
  shortcode: string,
  confirmationUrl: string,
  validationUrl: string
): Promise<any> {
  const token = await getDarajaToken()
  const res = await axios.post(
    `${BASE_URL}/mpesa/c2b/v1/registerurl`,
    {
      ShortCode: shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.data
}
