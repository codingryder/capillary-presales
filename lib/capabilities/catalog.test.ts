import { describe, expect, it } from 'vitest'
import { CAPABILITY_BY_ID, CAPABILITY_CATALOG, capabilitiesForRequirement } from './catalog'
import { LEVER_CAPS, type ImpactLever } from '@/lib/types/capability'
import { ALL_REQUIREMENTS } from '@/lib/types/requirements'

const VALID_LEVERS: ImpactLever[] = [
  'redemptionRateUpliftPp',
  'retentionUpliftPct',
  'frequencyUpliftPct',
  'aovUpliftPct',
  'rewardCostDeltaPct',
]

describe('catalog shape', () => {
  it('has unique capability ids', () => {
    const ids = CAPABILITY_CATALOG.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every impact uses a valid lever', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const i of cap.impacts) {
        expect(VALID_LEVERS).toContain(i.lever)
      }
    }
  })

  it('every impact has low ≤ mid ≤ high', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const i of cap.impacts) {
        expect(i.low).toBeLessThanOrEqual(i.mid)
        expect(i.mid).toBeLessThanOrEqual(i.high)
      }
    }
  })

  it('rewardCostDeltaPct impacts are non-positive (optimisation only)', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const i of cap.impacts) {
        if (i.lever === 'rewardCostDeltaPct') {
          expect(i.low).toBeLessThanOrEqual(0)
          expect(i.mid).toBeLessThanOrEqual(0)
          expect(i.high).toBeLessThanOrEqual(0)
        }
      }
    }
  })

  it('non-reward-cost impacts are non-negative', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const i of cap.impacts) {
        if (i.lever !== 'rewardCostDeltaPct') {
          expect(i.low).toBeGreaterThanOrEqual(0)
          expect(i.mid).toBeGreaterThanOrEqual(0)
          expect(i.high).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('every addressedRequirement is a known RequirementCategory', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const r of cap.addresses) {
        expect(ALL_REQUIREMENTS).toContain(r)
      }
    }
  })

  it('CAPABILITY_BY_ID stays in sync with CAPABILITY_CATALOG', () => {
    expect(Object.keys(CAPABILITY_BY_ID)).toHaveLength(CAPABILITY_CATALOG.length)
    for (const cap of CAPABILITY_CATALOG) {
      expect(CAPABILITY_BY_ID[cap.id]).toBe(cap)
    }
  })

  it('individual mid-impacts stay within per-lever caps (no single cap overshoots)', () => {
    for (const cap of CAPABILITY_CATALOG) {
      for (const i of cap.impacts) {
        const { min, max } = LEVER_CAPS[i.lever]
        // A single capability's mid shouldn't already exceed the lever cap.
        if (i.mid >= 0) {
          expect(i.mid).toBeLessThanOrEqual(max)
        } else {
          expect(i.mid).toBeGreaterThanOrEqual(min)
        }
      }
    }
  })
})

describe('capabilitiesForRequirement', () => {
  it('returns capabilities whose `addresses` includes the requirement', () => {
    const caps = capabilitiesForRequirement('lapsing-members')
    expect(caps.length).toBeGreaterThan(0)
    for (const c of caps) {
      expect(c.addresses).toContain('lapsing-members')
    }
  })

  it('returns [] for an unknown requirement', () => {
    expect(capabilitiesForRequirement('this-does-not-exist')).toEqual([])
  })
})
