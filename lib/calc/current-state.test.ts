import { describe, expect, it } from 'vitest'
import type { DiscoveryInput } from '@/lib/types/discovery'
import { computeCurrentState } from './current-state'
import { isComputed } from './util'

/**
 * Worked example used across the calc tests. Keep numbers round so reviewers can
 * verify by inspection:
 *
 *   activeMembers       = 100,000
 *   pointsIssued        = 50,000,000 over 6 months → 100M annualised
 *   pointsRedeemed      = 20,000,000 over 6 months →  40M annualised
 *   outstandingPoints   = 30,000,000
 *   pointValue          = ₹0.10
 *   aov                 = ₹500
 *   purchaseFrequency   = 4 / year
 *   grossMarginPct      = 30%
 *   rewardCostPct       = 5%
 *
 * Expected current-state numbers:
 *   pointsLiability     = 30M × 0.10        = ₹3,000,000
 *   redemptionRate      = 20M / 50M         = 0.40
 *   breakageRate        = 1 − 0.40          = 0.60
 *   earnBurnRatio       = 50M / 20M         = 2.5
 *   breakageValue       = 100M × 0.60 × 0.10= ₹6,000,000
 *   redemptionCost      = 40M × 0.10        = ₹4,000,000
 *   memberRevenue       = 100k × 4 × 500    = ₹200,000,000
 *   grossMargin         = 200M × 0.30       = ₹60,000,000
 *   rewardSpend         = 200M × 0.05       = ₹10,000,000
 */
export const SAMPLE_DISCOVERY: DiscoveryInput = {
  prospect: { name: 'Acme Retail', currency: 'INR' },
  members: { total: 250_000, active: 100_000, lapsed: 150_000 },
  timeframeMonths: 6,
  pointsIssued: 50_000_000,
  pointsRedeemed: 20_000_000,
  outstandingPoints: 30_000_000,
  pointValue: 0.1,
  averageOrderValue: 500,
  purchaseFrequencyPerYear: 4,
  grossMarginPct: 0.3,
  rewardCostPctOfRevenue: 0.05,
}

describe('computeCurrentState — happy path', () => {
  const { result, missing } = computeCurrentState(SAMPLE_DISCOVERY)

  it('reports no missing inputs when discovery is complete', () => {
    expect(missing).toEqual([])
  })

  it('computes pointsLiability', () => {
    expect(result.pointsLiability.value).toBeCloseTo(3_000_000)
  })

  it('annualises points correctly (×2 from 6 months)', () => {
    expect(result.annualPointsIssued.value).toBe(100_000_000)
    expect(result.annualPointsRedeemed.value).toBe(40_000_000)
  })

  it('computes redemption rate / breakage rate / earn-burn', () => {
    expect(result.redemptionRate.value).toBeCloseTo(0.4)
    expect(result.breakageRate.value).toBeCloseTo(0.6)
    expect(result.earnBurnRatio.value).toBeCloseTo(2.5)
  })

  it('computes currency-denominated point flows', () => {
    expect(result.breakageValue.value).toBeCloseTo(6_000_000)
    expect(result.redemptionCost.value).toBeCloseTo(4_000_000)
  })

  it('computes revenue, margin, reward spend', () => {
    expect(result.memberRevenue.value).toBe(200_000_000)
    expect(result.grossMargin.value).toBeCloseTo(60_000_000)
    expect(result.rewardSpend.value).toBe(10_000_000)
  })

  it('echoes activeMembers as a Metric', () => {
    expect(result.activeMembers.value).toBe(100_000)
  })
})

describe('computeCurrentState — missing inputs', () => {
  it('flags missing pointValue and leaves liability NaN', () => {
    const { result, missing } = computeCurrentState({
      ...SAMPLE_DISCOVERY,
      pointValue: undefined,
    })
    expect(isComputed(result.pointsLiability)).toBe(false)
    expect(isComputed(result.breakageValue)).toBe(false)
    expect(isComputed(result.redemptionCost)).toBe(false)
    expect(missing).toContain('pointValue')
  })

  it('flags missing AOV and leaves memberRevenue NaN', () => {
    const { result, missing } = computeCurrentState({
      ...SAMPLE_DISCOVERY,
      averageOrderValue: undefined,
    })
    expect(isComputed(result.memberRevenue)).toBe(false)
    expect(isComputed(result.grossMargin)).toBe(false)
    expect(isComputed(result.rewardSpend)).toBe(false)
    expect(missing).toContain('averageOrderValue')
  })

  it('uses annualMemberRevenue when provided directly', () => {
    const { result, missing } = computeCurrentState({
      ...SAMPLE_DISCOVERY,
      averageOrderValue: undefined,
      purchaseFrequencyPerYear: undefined,
      annualMemberRevenue: 250_000_000,
    })
    expect(result.memberRevenue.value).toBe(250_000_000)
    expect(result.grossMargin.value).toBeCloseTo(75_000_000) // 250M × 0.30
    expect(missing).not.toContain('averageOrderValue')
  })

  it('defaults timeframeMonths to 12 when unset', () => {
    const { result } = computeCurrentState({
      ...SAMPLE_DISCOVERY,
      timeframeMonths: undefined,
      pointsIssued: 100_000_000,
      pointsRedeemed: 40_000_000,
    })
    expect(result.annualPointsIssued.value).toBe(100_000_000)
    expect(result.annualPointsRedeemed.value).toBe(40_000_000)
  })
})
