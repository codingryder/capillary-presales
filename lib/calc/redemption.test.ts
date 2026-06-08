import { describe, expect, it } from 'vitest'
import {
  annualPointsIssued,
  annualPointsRedeemed,
  breakageRate,
  breakageValue,
  earnBurnRatio,
  redemptionCost,
  redemptionRate,
} from './redemption'

describe('annualisation', () => {
  it('annualises 6-month points by ×2', () => {
    // 50M points issued in 6 months → 100M annualised
    expect(
      annualPointsIssued({ pointsIssued: 50_000_000, timeframeMonths: 6 }).value,
    ).toBe(100_000_000)
    expect(
      annualPointsRedeemed({ pointsRedeemed: 20_000_000, timeframeMonths: 6 })
        .value,
    ).toBe(40_000_000)
  })

  it('is a no-op for 12-month figures', () => {
    expect(
      annualPointsIssued({ pointsIssued: 100_000_000, timeframeMonths: 12 })
        .value,
    ).toBe(100_000_000)
  })

  it('rejects non-positive timeframes', () => {
    expect(() =>
      annualPointsIssued({ pointsIssued: 1, timeframeMonths: 0 }),
    ).toThrow()
  })
})

describe('rates', () => {
  it('redemptionRate = redeemed ÷ issued', () => {
    // 20M redeemed ÷ 50M issued = 0.40
    expect(
      redemptionRate({ pointsIssued: 50_000_000, pointsRedeemed: 20_000_000 })
        .value,
    ).toBeCloseTo(0.4)
  })

  it('breakageRate = 1 − redemptionRate', () => {
    // 1 − 0.40 = 0.60
    expect(
      breakageRate({ pointsIssued: 50_000_000, pointsRedeemed: 20_000_000 })
        .value,
    ).toBeCloseTo(0.6)
  })

  it('earnBurnRatio = issued ÷ redeemed', () => {
    // 50M ÷ 20M = 2.5
    expect(
      earnBurnRatio({ pointsIssued: 50_000_000, pointsRedeemed: 20_000_000 })
        .value,
    ).toBeCloseTo(2.5)
  })

  it('throws when pointsIssued ≤ 0 (rate undefined)', () => {
    expect(() =>
      redemptionRate({ pointsIssued: 0, pointsRedeemed: 5 }),
    ).toThrow()
  })

  it('throws when pointsRedeemed ≤ 0 (earnBurn undefined)', () => {
    expect(() =>
      earnBurnRatio({ pointsIssued: 5, pointsRedeemed: 0 }),
    ).toThrow()
  })
})

describe('currency flows', () => {
  it('breakageValue = annualIssued × breakageRate × pointValue', () => {
    // 100M × 0.60 × 0.10 = 6,000,000
    expect(
      breakageValue({
        annualPointsIssued: 100_000_000,
        breakageRate: 0.6,
        pointValue: 0.1,
      }).value,
    ).toBeCloseTo(6_000_000)
  })

  it('redemptionCost = annualRedeemed × pointValue', () => {
    // 40M × 0.10 = 4,000,000
    expect(
      redemptionCost({ annualPointsRedeemed: 40_000_000, pointValue: 0.1 })
        .value,
    ).toBeCloseTo(4_000_000)
  })
})
