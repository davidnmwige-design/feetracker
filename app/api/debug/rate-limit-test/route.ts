import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const hasUpstashUrl = !!process.env.UPSTASH_REDIS_REST_URL
  const hasUpstashToken = !!process.env.UPSTASH_REDIS_REST_TOKEN

  let redisWorking = false
  let testResult = null

  try {
    if (hasUpstashUrl && hasUpstashToken) {
      const response = await fetch(
        process.env.UPSTASH_REDIS_REST_URL + '/set/debug-test/1',
        {
          headers: {
            Authorization: 'Bearer ' + process.env.UPSTASH_REDIS_REST_TOKEN
          }
        }
      )
      const data = await response.json()
      redisWorking = data.result === 'OK'
      testResult = data
    }
  } catch (error) {
    testResult = String(error)
  }

  return NextResponse.json({
    hasUpstashUrl,
    hasUpstashToken,
    redisWorking,
    testResult,
    message: redisWorking ? 'Redis connected and working' : 'Redis NOT working'
  })
}
