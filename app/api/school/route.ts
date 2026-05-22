import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, invalidateCache, CacheKeys } from '@/lib/cache'
import { parseBody, updateSchoolSchema } from '@/lib/schemas'

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

    await setCache(cacheKey, ctx.school, 300)
    return NextResponse.json(ctx.school)
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

    // Build update object from validated data, excluding undefined fields
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) data[k] = v
    }

    const school = await prisma.school.update({ where: { id: ctx.school.id }, data })
    await invalidateCache(CacheKeys.schoolSettings(ctx.school.id))
    return NextResponse.json(school)
  } catch (err) {
    console.error('school PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
