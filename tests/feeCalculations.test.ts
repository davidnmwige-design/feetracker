import { describe, it, expect } from 'vitest'
import { calculateFeeBreakdown, getEffectiveFee, getBursaryDiscount } from '../lib/feeCalculations'

describe('calculateFeeBreakdown', () => {
  it('returns the full fee when there are no discounts', () => {
    const r = calculateFeeBreakdown(50000)
    expect(r.effectiveFee).toBe(50000)
    expect(r.totalDiscount).toBe(0)
    expect(r.discounts).toHaveLength(0)
  })

  it('applies a percentage bursary', () => {
    const r = calculateFeeBreakdown(50000, { discountType: 'percentage', discountValue: 10, active: true, endDate: null })
    expect(r.totalDiscount).toBe(5000)
    expect(r.effectiveFee).toBe(45000)
  })

  it('applies a fixed bursary', () => {
    const r = calculateFeeBreakdown(50000, { discountType: 'fixed', discountValue: 8000, active: true, endDate: null })
    expect(r.effectiveFee).toBe(42000)
  })

  it('ignores an inactive bursary', () => {
    const r = calculateFeeBreakdown(50000, { discountType: 'fixed', discountValue: 8000, active: false, endDate: null })
    expect(r.effectiveFee).toBe(50000)
  })

  it('ignores an expired bursary but applies one ending in the future', () => {
    const past = new Date('2020-01-01')
    const future = new Date('2999-01-01')
    expect(getEffectiveFee(50000, { discountType: 'fixed', discountValue: 8000, active: true, endDate: past })).toBe(50000)
    expect(getEffectiveFee(50000, { discountType: 'fixed', discountValue: 8000, active: true, endDate: future })).toBe(42000)
  })

  it('stacks a bursary and an active discount, skipping inactive discounts', () => {
    const r = calculateFeeBreakdown(
      50000,
      { discountType: 'percentage', discountValue: 10, active: true, endDate: null }, // 5000
      [
        { discount: { name: 'Sibling', discountType: 'fixed', discountValue: 3000, active: true } },
        { discount: { name: 'Old', discountType: 'fixed', discountValue: 9999, active: false } },
      ],
    )
    expect(r.totalDiscount).toBe(8000)
    expect(r.effectiveFee).toBe(42000)
    expect(r.discounts).toHaveLength(2)
  })

  it('caps total discount at the fee so the effective fee is never negative', () => {
    const r = calculateFeeBreakdown(10000, { discountType: 'fixed', discountValue: 999999, active: true, endDate: null })
    expect(r.totalDiscount).toBe(10000)
    expect(r.effectiveFee).toBe(0)
  })

  it('rounds percentage discounts to the nearest shilling', () => {
    const r = calculateFeeBreakdown(33333, { discountType: 'percentage', discountValue: 10, active: true, endDate: null })
    expect(r.totalDiscount).toBe(3333) // Math.round(3333.3)
  })
})

describe('getBursaryDiscount', () => {
  it('returns the bursary discount amount', () => {
    expect(getBursaryDiscount(50000, { discountType: 'percentage', discountValue: 20, active: true, endDate: null })).toBe(10000)
  })
})
