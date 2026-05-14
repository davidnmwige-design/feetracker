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
