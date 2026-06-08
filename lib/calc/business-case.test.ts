import { describe, expect, it } from 'vitest'
import type { Assumptions } from '@/lib/types/assumptions'
import { SAMPLE_DISCOVERY } from '@/lib/sample'
import { buildBusinessCase } from './business-case'

/**
 * Worked deltas from the SAMPLE_DISCOVERY + FUTURE_ASSUMPTIONS pair:
 *
 *   ΔredemptionRate    = 0.50 − 0.40             = 0.10
 *   ΔmemberRevenue     = 242.55M − 200M          = 42,550,000
 *   ΔgrossMargin       =  72.765M − 60M          = 12,765,000
 *   ΔbreakageValue     =   6.0638M − 6M          =     63,750
 *   ΔrewardSpend       =   9.702M − 10M          =   −298,000
 *   ΔredemptionCost    =   6.0638M − 4M          =  2,063,750
 *   ΔprogramCost       = −298,000 + 2,063,750 + 5,000,000  = 6,765,750
 *   annualUplift       = 12,765,000 − 6,765,750             = 5,999,250
 *   threeYearNetValue  = 5,999,250 × 3 − 10,000,000         = 7,997,750
 *   paybackMonths      = 10,000,000 ÷ (5,999,250 ÷ 12)      ≈ 20.0025
 */
const ASSUMPTIONS: Assumptions = {
  redemptionRateUpliftPp: 0.1,
  retentionUpliftPct: 0.1,
  frequencyUpliftPct: 0.05,
  aovUpliftPct: 0.05,
  rewardCostDeltaPct: -0.2,
  annualPlatformCost: 5_000_000,
  oneTimeImplementationCost: 10_000_000,
}

describe('buildBusinessCase — deltas', () => {
  const bc = buildBusinessCase(SAMPLE_DISCOVERY, ASSUMPTIONS)

  it('Δ redemptionRate', () => {
    expect(bc.delta.redemptionRate.value).toBeCloseTo(0.1)
  })

  it('Δ memberRevenue', () => {
    expect(bc.delta.memberRevenue.value).toBeCloseTo(42_550_000)
  })

  it('Δ grossMargin', () => {
    expect(bc.delta.grossMargin.value).toBeCloseTo(12_765_000)
  })

  it('Δ breakageValue', () => {
    expect(bc.delta.breakageValue.value).toBeCloseTo(63_750)
  })

  it('Δ programCost = Δreward + Δredemption + platform', () => {
    // −298,000 + 2,063,750 + 5,000,000 = 6,765,750
    expect(bc.delta.programCost.value).toBeCloseTo(6_765_750)
  })
})

describe('buildBusinessCase — headline', () => {
  const bc = buildBusinessCase(SAMPLE_DISCOVERY, ASSUMPTIONS)

  it('annualUplift = ΔgrossMargin − ΔprogramCost', () => {
    // 12,765,000 − 6,765,750 = 5,999,250
    expect(bc.headline.annualUplift.value).toBeCloseTo(5_999_250)
  })

  it('threeYearNetValue = annualUplift × 3 − oneTimeImpl', () => {
    // 17,997,750 − 10,000,000 = 7,997,750
    expect(bc.headline.threeYearNetValue.value).toBeCloseTo(7_997_750)
  })

  it('paybackMonths ≈ 20.0', () => {
    expect(bc.headline.paybackMonths).toBeDefined()
    expect(bc.headline.paybackMonths!.value).toBeCloseTo(20.0025, 2)
  })

  it('omits paybackMonths when oneTimeImplementationCost is 0', () => {
    const bc2 = buildBusinessCase(SAMPLE_DISCOVERY, {
      ...ASSUMPTIONS,
      oneTimeImplementationCost: 0,
    })
    expect(bc2.headline.paybackMonths).toBeUndefined()
  })

  it('omits paybackMonths when annualUplift is non-positive', () => {
    const bc2 = buildBusinessCase(SAMPLE_DISCOVERY, {
      ...ASSUMPTIONS,
      // make levers neutral so annual uplift collapses
      redemptionRateUpliftPp: 0,
      retentionUpliftPct: 0,
      frequencyUpliftPct: 0,
      aovUpliftPct: 0,
      rewardCostDeltaPct: 0,
      annualPlatformCost: 1_000_000, // a cost with no benefit → negative uplift
    })
    expect(bc2.headline.paybackMonths).toBeUndefined()
  })
})

describe('buildBusinessCase — missing inputs surface up', () => {
  it('lists missing fields from current+future without duplicates', () => {
    const bc = buildBusinessCase(
      { ...SAMPLE_DISCOVERY, averageOrderValue: undefined },
      ASSUMPTIONS,
    )
    expect(bc.missingInputs).toContain('averageOrderValue')
    expect(bc.missingInputs.filter((x) => x === 'averageOrderValue')).toHaveLength(1)
  })
})
