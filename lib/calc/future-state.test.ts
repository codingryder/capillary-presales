import { describe, expect, it } from 'vitest'
import type { Assumptions } from '@/lib/types/assumptions'
import { SAMPLE_DISCOVERY } from '@/lib/sample'
import { computeFutureState } from './future-state'

/**
 * Future-state assumptions used across these tests:
 *   redemptionRateUpliftPp = +10pp     → 0.40 → 0.50
 *   retentionUpliftPct     = +10%      → active 100k → 110k
 *   frequencyUpliftPct     = +5%       → freq 4 → 4.2
 *   aovUpliftPct           = +5%       → AOV 500 → 525
 *   rewardCostDeltaPct     = −20%      → rewardCostPct 0.05 → 0.04
 *   annualPlatformCost     = 5,000,000
 *   oneTimeImpl            = 10,000,000
 *
 * Worked forward from SAMPLE_DISCOVERY:
 *   futureActive          = 110,000
 *   futureFreq            = 4.2
 *   futureAov             = 525
 *   futureMemberRevenue   = 110,000 × 4.2 × 525        = 242,550,000
 *   futureGrossMargin     = 242,550,000 × 0.30         =  72,765,000
 *   futureRewardSpend     = 242,550,000 × 0.04         =   9,702,000
 *   pointsPerCurrency     = 100M / 200M                = 0.5
 *   futureAnnualIssued    = 242,550,000 × 0.5          = 121,275,000
 *   futureRedemptionRate  = 0.40 + 0.10                = 0.50
 *   futureAnnualRedeemed  = 121,275,000 × 0.50         =  60,637,500
 *   futureBreakageValue   = 121,275,000 × 0.50 × 0.10  =   6,063,750
 *   futureRedemptionCost  =  60,637,500 × 0.10         =   6,063,750
 */
const FUTURE_ASSUMPTIONS: Assumptions = {
  redemptionRateUpliftPp: 0.1,
  retentionUpliftPct: 0.1,
  frequencyUpliftPct: 0.05,
  aovUpliftPct: 0.05,
  rewardCostDeltaPct: -0.2,
  annualPlatformCost: 5_000_000,
  oneTimeImplementationCost: 10_000_000,
}

describe('computeFutureState', () => {
  const { result, missing } = computeFutureState(
    SAMPLE_DISCOVERY,
    FUTURE_ASSUMPTIONS,
  )

  it('reports no missing inputs when discovery is complete', () => {
    expect(missing).toEqual([])
  })

  it('scales active members by (1 + retentionUpliftPct)', () => {
    expect(result.activeMembers.value).toBeCloseTo(110_000)
  })

  it('grows member revenue by retention × frequency × AOV uplifts', () => {
    expect(result.memberRevenue.value).toBeCloseTo(242_550_000)
  })

  it('applies marginPct (unchanged) to future revenue', () => {
    expect(result.grossMargin.value).toBeCloseTo(72_765_000)
  })

  it('applies rewardCostDeltaPct to the % of revenue', () => {
    expect(result.rewardSpend.value).toBeCloseTo(9_702_000)
  })

  it('scales issuance proportionally to revenue (constant pointsPerCurrency)', () => {
    expect(result.annualPointsIssued.value).toBeCloseTo(121_275_000)
  })

  it('adds redemptionRateUpliftPp absolutely (capped at 1)', () => {
    expect(result.redemptionRate.value).toBeCloseTo(0.5)
  })

  it('computes future redeemed / breakage value / redemption cost', () => {
    expect(result.annualPointsRedeemed.value).toBeCloseTo(60_637_500)
    expect(result.breakageRate.value).toBeCloseTo(0.5)
    expect(result.breakageValue.value).toBeCloseTo(6_063_750)
    expect(result.redemptionCost.value).toBeCloseTo(6_063_750)
  })

  it('caps redemption rate at 1.0 even with extreme uplift', () => {
    const { result } = computeFutureState(SAMPLE_DISCOVERY, {
      ...FUTURE_ASSUMPTIONS,
      redemptionRateUpliftPp: 0.9, // 0.4 + 0.9 = 1.3 → cap to 1.0
    })
    expect(result.redemptionRate.value).toBe(1)
  })

  it('holds pointsLiability flat (balance-sheet stock)', () => {
    expect(result.pointsLiability.value).toBeCloseTo(3_000_000)
  })
})
