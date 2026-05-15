export function getEffectiveFee(
  feeRequired: number,
  bursary?: { discountType: string; discountValue: number; active: boolean; endDate: Date | null } | null
): number {
  if (!bursary || !bursary.active) return feeRequired
  if (bursary.endDate && new Date(bursary.endDate) < new Date()) return feeRequired
  if (bursary.discountType === 'percentage') {
    return Math.max(0, feeRequired * (1 - bursary.discountValue / 100))
  }
  return Math.max(0, feeRequired - bursary.discountValue)
}

export function getBursaryDiscount(
  feeRequired: number,
  bursary?: { discountType: string; discountValue: number; active: boolean; endDate: Date | null } | null
): number {
  return feeRequired - getEffectiveFee(feeRequired, bursary)
}
