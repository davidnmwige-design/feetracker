import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, invalidateCache, CacheKeys } from '@/lib/cache'
import { parseBody, updateSchoolSchema } from '@/lib/schemas'
import { encrypt } from '@/lib/encrypt'

// Never expose the raw M-Pesa passkey to the client — surface only whether one is set.
function sanitizeSchool<T extends { mpesaPasskey?: string | null }>(school: T) {
  const { mpesaPasskey, ...rest } = school
  return { ...rest, mpesaPasskeySet: Boolean(mpesaPasskey) }
}

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json(null)
    if (!hasPermission(ctx.role, 'school', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const cacheKey = CacheKeys.schoolSettings(ctx.school.id)
    const cached = await getCache(cacheKey)
    if (cached) return NextResponse.json(cached)

    const safe = sanitizeSchool(ctx.school)
    await setCache(cacheKey, safe, 300)
    return NextResponse.json(safe)
  } catch (err) {
    console.error('school GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })
    if (!hasPermission(ctx.role, 'school', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(updateSchoolSchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

    if (parsed.data.paybill) {
      const conflict = await prisma.school.findFirst({
        where: { paybill: parsed.data.paybill, id: { not: ctx.school.id } },
      })
      if (conflict) return NextResponse.json({ error: 'This paybill number is already registered to another school' }, { status: 400 })
    }

    // Build update object from validated data, excluding undefined fields.
    // The M-Pesa passkey is a secret — encrypt before storing (empty clears it).
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v === undefined) continue
      if (k === 'mpesaPasskey') {
        data.mpesaPasskey = v ? encrypt(String(v)) : null
      } else {
        data[k] = v
      }
    }

    const school = await prisma.school.update({ where: { id: ctx.school.id }, data })
    await invalidateCache(CacheKeys.schoolSettings(ctx.school.id))
    return NextResponse.json(sanitizeSchool(school))
  } catch (err) {
    console.error('school PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
