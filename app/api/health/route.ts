import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - start

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        latencyMs: dbLatency,
      },
      environment: process.env.NODE_ENV,
    })
  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    }, { status: 503 })
  }
}
