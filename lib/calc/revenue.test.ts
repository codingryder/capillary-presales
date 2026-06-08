import { describe, expect, it } from 'vitest'
import { grossMargin, memberRevenue, rewardSpend } from './revenue'

describe('memberRevenue', () => {
  it('multiplies activeMembers × frequency × AOV', () => {
    // 100,000 × 4 × 500 = 200,000,000
    expect(
      memberRevenue({
        activeMembers: 100_000,
        purchaseFrequencyPerYear: 4,
        averageOrderValue: 500,
      }).value,
    ).toBe(200_000_000)
  })
})

describe('grossMargin', () => {
  it('applies marginPct to memberRevenue', () => {
    // 200M × 0.30 = 60M
    expect(
      grossMargin({ memberRevenue: 200_000_000, grossMarginPct: 0.3 }).value,
    ).toBeCloseTo(60_000_000)
  })
})

describe('rewardSpend', () => {
  it('applies rewardCostPctOfRevenue to memberRevenue', () => {
    // 200M × 0.05 = 10M
    expect(
      rewardSpend({
        memberRevenue: 200_000_000,
        rewardCostPctOfRevenue: 0.05,
      }).value,
    ).toBe(10_000_000)
  })
})
