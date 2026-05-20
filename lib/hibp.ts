import crypto from 'crypto'
export { formatBreachMessage } from './hibpMessages'

export async function isPasswordBreached(password: string): Promise<{ breached: boolean; count: number; error?: string }> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.substring(0, 5)
    const suffix = sha1.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Elimu-Pay-Password-Check',
        'Add-Padding': 'true',
      },
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) {
      console.error('HIBP API error:', response.status)
      return { breached: false, count: 0, error: 'HIBP unavailable' }
    }

    const text = await response.text()
    for (const line of text.split('\n')) {
      const [hashSuffix, countStr] = line.split(':')
      if (hashSuffix.trim().toUpperCase() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) }
      }
    }

    return { breached: false, count: 0 }
  } catch (error) {
    console.error('HIBP check failed:', error)
    return { breached: false, count: 0, error: String(error) }
  }
}
