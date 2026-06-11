import { NextResponse } from 'next/server'
import { secureEqual } from '@/lib/secureCompare'

export async function POST(req: Request) {
  // Authenticate the callback via the shared secret embedded in the registered URL.
  const expectedToken = process.env.DARAJA_CALLBACK_SECRET
  const providedToken = new URL(req.url).searchParams.get('t')
  if (!expectedToken || !secureEqual(providedToken, expectedToken)) {
    // Reject the transaction for any request that is not an authenticated Safaricom callback.
    return NextResponse.json({ ResultCode: 'C2B00016', ResultDesc: 'Rejected' })
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}
