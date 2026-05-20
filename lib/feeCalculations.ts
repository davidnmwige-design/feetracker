export interface DiscountSummary {
  name: string
  type: 'bursary' | 'discount'
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
}

export function calculateFeeBreakdown(
  feeRequired: number,
  bursary?: { discountType: string; discountValue: number; active: boolean; endDate?: Date | null; description?: string | null } | null,
  studentDiscounts?: Array<{ discount: { name: string; discountType: string; discountValue: number; active: boolean } }> | null
): {
  originalFee: number
  totalDiscount: number
  effectiveFee: number
  discounts: DiscountSummary[]
} {
  let totalDiscount = 0
  const discounts: DiscountSummary[] = []

  if (bursary?.active) {
    if (!bursary.endDate || new Date(bursary.endDate) >= new Date()) {
      let amount = 0
      if (bursary.discountType === 'percentage') {
        amount = Math.round(feeRequired * (bursary.discountValue / 100))
      } else {
        amount = bursary.discountValue
      }
      totalDiscount += amount
      discounts.push({
        name: bursary.description || 'Bursary',
        type: 'bursary',
        discountType: bursary.discountType as 'percentage' | 'fixed',
        discountValue: bursary.discountValue,
        discountAmount: amount,
      })
    }
  }

  if (studentDiscounts) {
    for (const sd of studentDiscounts) {
      if (!sd.discount.active) continue
      let amount = 0
      if (sd.discount.discountType === 'percentage') {
        amount = Math.round(feeRequired * (sd.discount.discountValue / 100))
      } else {
        amount = sd.discount.discountValue
      }
      totalDiscount += amount
      discounts.push({
        name: sd.discount.name,
        type: 'discount',
        discountType: sd.discount.discountType as 'percentage' | 'fixed',
        discountValue: sd.discount.discountValue,
        discountAmount: amount,
      })
    }
  }

  totalDiscount = Math.min(totalDiscount, feeRequired)
  const effectiveFee = Math.max(0, feeRequired - totalDiscount)

  return { originalFee: feeRequired, totalDiscount, effectiveFee, discounts }
}

export function getEffectiveFee(
  feeRequired: number,
  bursary?: { discountType: string; discountValue: number; active: boolean; endDate: Date | null } | null,
  studentDiscounts?: Array<{ discount: { name: string; discountType: string; discountValue: number; active: boolean } }> | null
): number {
  return calculateFeeBreakdown(feeRequired, bursary, studentDiscounts).effectiveFee
}

export function getBursaryDiscount(
  feeRequired: number,
  bursary?: { discountType: string; discountValue: number; active: boolean; endDate: Date | null } | null
): number {
  return feeRequired - getEffectiveFee(feeRequired, bursary)
}
