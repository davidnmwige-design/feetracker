import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const value = await client.get<T>(key)
    return value ?? null
  } catch {
    return null
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Cache is not critical — fail silently
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    if (keys.length > 0) await client.del(...keys)
  } catch {
    // Fail silently
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) await client.del(...keys)
  } catch {
    // Fail silently
  }
}

export const CacheKeys = {
  schoolSettings: (schoolId: number) => `school:${schoolId}:settings`,
  schoolStudents: (schoolId: number) => `school:${schoolId}:students`,
  onboardingStatus: (schoolId: number) => `school:${schoolId}:onboarding`,
  dashboardMetrics: (schoolId: number) => `school:${schoolId}:dashboard`,
}

export function isCacheEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
