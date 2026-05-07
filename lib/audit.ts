import { prisma } from '@/lib/prisma'

export async function logAudit(params: {
  userId?: number
  schoolId?: number
  action: string
  details?: string
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({ data: params })
  } catch {
    // Audit failures must never crash the main flow
  }
}
