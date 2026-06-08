import { describe, expect, it } from 'vitest'
import { deriveAssumptions, emptyDerivation } from './derive'
import { LEVER_CAPS } from '@/lib/types/capability'
import { CAPABILITY_BY_ID } from './catalog'

describe('emptyDerivation', () => {
  const d = emptyDerivation()

  it('produces all-zero levers', () => {
    expect(d.assumptions.redemptionRateUpliftPp).toBe(0)
    expect(d.assumptions.retentionUpliftPct).toBe(0)
    expect(d.assumptions.frequencyUpliftPct).toBe(0)
    expect(d.assumptions.aovUpliftPct).toBe(0)
    expect(d.assumptions.rewardCostDeltaPct).toBe(0)
  })

  it('cost levers default to zero', () => {
    expect(d.assumptions.annualPlatformCost).toBe(0)
    expect(d.assumptions.oneTimeImplementationCost).toBe(0)
  })

  it('reports no selected capabilities and empty contributors', () => {
    expect(d.selectedCapabilityIds).toEqual([])
    expect(d.provenance.redemptionRateUpliftPp.contributors).toEqual([])
    expect(d.provenance.retentionUpliftPct.contributors).toEqual([])
  })

  it('passes cost inputs through', () => {
    const d2 = emptyDerivation({
      annualPlatformCost: 1_000_000,
      oneTimeImplementationCost: 5_000_000,
    })
    expect(d2.assumptions.annualPlatformCost).toBe(1_000_000)
    expect(d2.assumptions.oneTimeImplementationCost).toBe(5_000_000)
  })
})

describe('deriveAssumptions — single capability', () => {
  it('takes the chosen scenario value', () => {
    // wallet-instant-redemption has redemptionRateUpliftPp { low: 0.02, mid: 0.035, high: 0.05 }
    const cap = CAPABILITY_BY_ID['wallet-instant-redemption']
    expect(cap).toBeDefined()
    const d = deriveAssumptions({
      selection: { 'wallet-instant-redemption': 'mid' },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(d.assumptions.redemptionRateUpliftPp).toBeCloseTo(0.035)
    expect(d.provenance.redemptionRateUpliftPp.contributors).toHaveLength(1)
    expect(
      d.provenance.redemptionRateUpliftPp.contributors[0].capabilityId,
    ).toBe('wallet-instant-redemption')
    expect(d.provenance.redemptionRateUpliftPp.contributors[0].scenario).toBe('mid')
  })

  it('low / high pick the corresponding band', () => {
    const lowD = deriveAssumptions({
      selection: { 'wallet-instant-redemption': 'low' },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(lowD.assumptions.redemptionRateUpliftPp).toBeCloseTo(0.02)

    const highD = deriveAssumptions({
      selection: { 'wallet-instant-redemption': 'high' },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(highD.assumptions.redemptionRateUpliftPp).toBeCloseTo(0.05)
  })
})

describe('deriveAssumptions — multiple capabilities sum', () => {
  it('sums per-lever contributions across capabilities', () => {
    // wallet-instant-redemption mid: redemptionRateUpliftPp = 0.035
    // breakage-optimisation   mid: redemptionRateUpliftPp = 0.03
    // sum = 0.065 → below cap 0.20 → no clamp
    const d = deriveAssumptions({
      selection: {
        'wallet-instant-redemption': 'mid',
        'breakage-optimisation': 'mid',
      },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(d.assumptions.redemptionRateUpliftPp).toBeCloseTo(0.065)
    expect(d.provenance.redemptionRateUpliftPp.rawSum).toBeCloseTo(0.065)
    expect(d.provenance.redemptionRateUpliftPp.capped).toBe(false)
    expect(d.provenance.redemptionRateUpliftPp.contributors).toHaveLength(2)
  })
})

describe('deriveAssumptions — caps kick in', () => {
  it('clamps rawSum to LEVER_CAPS.max and flags capped:true', () => {
    // Force a giant sum by selecting many capabilities that all push retention.
    // Real catalog: soft-tier (mid 0.05) + winback (mid 0.03) + predictive-churn (mid 0.035)
    //              + journey-orchestration (mid 0.02) + gamified-challenges (mid 0.02)
    //              + surprise-delight (mid 0.025) + rfm (mid 0.02) + family (mid 0.02)
    // Sum ~ 0.22 — exceeds the 0.30 cap? No, 0.22 < 0.30, so it'd just sum.
    // Use 'high' scenario to push past 0.30:
    const d = deriveAssumptions({
      selection: {
        'soft-tier-mechanics': 'high',
        'winback-automation': 'high',
        'predictive-churn': 'high',
        'journey-orchestration': 'high',
        'gamified-challenges': 'high',
        'surprise-delight': 'high',
        'rfm-segmentation': 'high',
        'family-coalition': 'high',
      },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(d.provenance.retentionUpliftPct.rawSum).toBeGreaterThan(
      LEVER_CAPS.retentionUpliftPct.max,
    )
    expect(d.assumptions.retentionUpliftPct).toBeCloseTo(
      LEVER_CAPS.retentionUpliftPct.max,
    )
    expect(d.provenance.retentionUpliftPct.capped).toBe(true)
  })

  it('rewardCostDeltaPct cap floors at the negative max (most optimisation)', () => {
    const d = deriveAssumptions({
      selection: {
        'ai-nbo': 'low', // most aggressive optimisation: -0.05
        'breakage-optimisation': 'low', // -0.04
        'predictive-churn': 'low', // -0.03
        'rfm-segmentation': 'low', // -0.03
        'compliance-expiry-policy': 'low', // -0.02
        'surprise-delight': 'low', // -0.02
      },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(d.provenance.rewardCostDeltaPct.rawSum).toBeLessThan(
      LEVER_CAPS.rewardCostDeltaPct.min,
    )
    expect(d.assumptions.rewardCostDeltaPct).toBeCloseTo(
      LEVER_CAPS.rewardCostDeltaPct.min,
    )
    expect(d.provenance.rewardCostDeltaPct.capped).toBe(true)
  })
})

describe('deriveAssumptions — unknown capability ids are ignored', () => {
  it('skips capabilities not in the catalog without throwing', () => {
    const d = deriveAssumptions({
      selection: {
        'wallet-instant-redemption': 'mid',
        'this-is-not-real': 'mid',
      },
      annualPlatformCost: 0,
      oneTimeImplementationCost: 0,
    })
    expect(d.assumptions.redemptionRateUpliftPp).toBeCloseTo(0.035)
    expect(d.provenance.redemptionRateUpliftPp.contributors).toHaveLength(1)
  })
})
