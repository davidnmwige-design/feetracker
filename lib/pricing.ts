export const RATE_PER_STUDENT_PER_YEAR = 200

export const BILLING_DISCOUNTS = {
  monthly: 0,
  term: 0.025,
  annual: 0.05,
}

export const SETUP_FEES = {
  small:      { maxStudents: 200,      fee: 25000,  label: 'Up to 200 students'   },
  medium:     { maxStudents: 400,      fee: 35000,  label: '201–400 students'     },
  large:      { maxStudents: 700,      fee: 50000,  label: '401–700 students'     },
  xlarge:     { maxStudents: 1000,     fee: 75000,  label: '701–1,000 students'   },
  enterprise: { maxStudents: Infinity, fee: 100000, label: '1,000+ students'      },
}

export const MINIMUM_ANNUAL = 20000

export function getSetupFee(studentCount: number): number {
  if (studentCount <= 200)  return 25000
  if (studentCount <= 400)  return 35000
  if (studentCount <= 700)  return 50000
  if (studentCount <= 1000) return 75000
  return 100000
}

export function getAnnualTotal(studentCount: number): number {
  const raw = studentCount * RATE_PER_STUDENT_PER_YEAR
  return Math.max(raw, MINIMUM_ANNUAL)
}

export function getBillingAmount(studentCount: number, cycle: 'monthly' | 'term' | 'annual'): number {
  const annual = getAnnualTotal(studentCount)
  const discount = BILLING_DISCOUNTS[cycle]
  const discountedAnnual = Math.round(annual * (1 - discount))
  if (cycle === 'monthly') return Math.round(discountedAnnual / 12)
  if (cycle === 'term')    return Math.round(discountedAnnual / 3)
  return discountedAnnual
}

export function getDiscountedAnnual(studentCount: number, cycle: 'monthly' | 'term' | 'annual'): number {
  const annual = getAnnualTotal(studentCount)
  const discount = BILLING_DISCOUNTS[cycle]
  return Math.round(annual * (1 - discount))
}

export function getAnnualSavings(studentCount: number, cycle: 'monthly' | 'term' | 'annual'): number {
  if (cycle === 'monthly') return 0
  const monthlyAnnual = getAnnualTotal(studentCount)
  const cycleAnnual = getDiscountedAnnual(studentCount, cycle)
  return monthlyAnnual - cycleAnnual
}

export function getPlanName(studentCount: number): string {
  if (studentCount <= 200)  return 'Starter'
  if (studentCount <= 400)  return 'Growth'
  if (studentCount <= 700)  return 'Professional'
  if (studentCount <= 1000) return 'Premium'
  return 'Enterprise'
}
