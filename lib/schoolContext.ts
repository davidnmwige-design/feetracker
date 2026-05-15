import { prisma } from './prisma'
import { getUserRole, type Role } from './permissions'

export type SchoolContext = {
  userId: number
  school: {
    id: number
    name: string
    userId: number
    paybill: string | null
    accountNumberFormat: string | null
    replyToEmail: string | null
    emailSignature: string | null
    whatsappNumber: string | null
    currentTerm: string
    currentPlan: string
    billingCycle: string
    trialEndsAt: Date | null
    trialExpiryNotified: boolean
    penaltyEnabled: boolean
    penaltyType: string
    penaltyAmount: number
    penaltyDueDate: number
    createdAt: Date
  }
  role: Role | null
}

export async function resolveSchool(email: string): Promise<SchoolContext | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      school: true,
      schoolUsers: {
        include: { school: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!user) return null
  const school = user.school ?? user.schoolUsers?.[0]?.school ?? null
  if (!school) return null
  const role = await getUserRole(user.id, school)
  return { userId: user.id, school, role }
}
