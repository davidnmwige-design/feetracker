import { prisma } from '@/lib/prisma'

export type Role = 'admin' | 'accountant' | 'principal' | 'viewer'

const PERM: Record<string, Partial<Record<string, Role[]>>> = {
  'students':             { GET: ['admin','accountant','principal','viewer'], POST: ['admin','accountant'], PATCH: ['admin','accountant'], DELETE: ['admin'] },
  'upload':               { POST: ['admin','accountant'] },
  'unmatched':            { GET: ['admin','accountant','principal'], POST: ['admin','accountant'] },
  'invoices':             { GET: ['admin','accountant'], POST: ['admin','accountant'] },
  'reminders/schedule':   { GET: ['admin','accountant','principal'], POST: ['admin','accountant'] },
  'reminders/sms':        { POST: ['admin','accountant'] },
  'terms':                { GET: ['admin','accountant','principal','viewer'], POST: ['admin'] },
  'school':               { GET: ['admin','accountant','principal','viewer'], PATCH: ['admin'] },
  'team':                 { GET: ['admin'], POST: ['admin'], DELETE: ['admin'] },
  'account':              { DELETE: ['admin'] },
  'report':               { GET: ['admin','accountant','principal','viewer'] },
  'fee-categories':       { GET: ['admin','accountant','principal'], POST: ['admin','accountant'], DELETE: ['admin','accountant'] },
  'export':               { GET: ['admin','accountant'] },
  'certificate':          { GET: ['admin','accountant'] },
  'send-email':           { POST: ['admin','accountant'] },
  'upgrade':              { POST: ['admin'] },
}

export async function getUserRole(
  userId: number,
  school: { id: number; userId: number }
): Promise<Role | null> {
  if (userId === school.userId) return 'admin'
  const su = await prisma.schoolUser.findFirst({ where: { userId, schoolId: school.id } })
  return su ? (su.role as Role) : null
}

export function hasPermission(role: Role | null, resource: string, method: string): boolean {
  if (!role) return false
  if (role === 'admin') return true
  const allowed = PERM[resource]?.[method.toUpperCase()]
  return !!allowed?.includes(role)
}

export const FORBIDDEN = { error: "You don't have permission to perform this action" } as const
