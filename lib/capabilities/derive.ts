import type { Assumptions } from '@/lib/types/assumptions'
import type {
  CapabilitySelection,
  DerivedAssumptions,
  ImpactLever,
  LeverContribution,
  LeverProvenance,
} from '@/lib/types/capability'
import { LEVER_CAPS } from '@/lib/types/capability'
import { CAPABILITY_BY_ID } from './catalog'

const ALL_LEVERS: ImpactLever[] = [
  'redemptionRateUpliftPp',
  'retentionUpliftPct',
  'frequencyUpliftPct',
  'aovUpliftPct',
  'rewardCostDeltaPct',
]

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Roll up a CapabilitySelection (which caps + scenarios) into a concrete
 * Assumptions object plus a per-lever provenance trail. Cost levers
 * (`annualPlatformCost`, `oneTimeImplementationCost`) come from the caller
 * directly — they're commercial inputs, not capability-driven.
 *
 * The math:
 *   1. For each lever, walk every selected capability and pick its low/mid/high
 *      number per the SA's chosen scenario.
 *   2. Sum contributions. Negative levers (rewardCostDeltaPct) sum negative.
 *   3. Clamp to LEVER_CAPS so unrealistic stacking is prevented; the raw sum
 *      is preserved in provenance so the SA can see "would have been X, capped
 *      at Y".
 */
export function deriveAssumptions(args: {
  selection: CapabilitySelection
  annualPlatformCost: number
  oneTimeImplementationCost: number
}): DerivedAssumptions {
  const selectedIds = Object.keys(args.selection)

  const provenance = {} as Record<ImpactLever, LeverProvenance>
  const assumptions = {
    redemptionRateUpliftPp: 0,
    retentionUpliftPct: 0,
    frequencyUpliftPct: 0,
    aovUpliftPct: 0,
    rewardCostDeltaPct: 0,
    annualPlatformCost: args.annualPlatformCost,
    oneTimeImplementationCost: args.oneTimeImplementationCost,
  } as Assumptions

  for (const lever of ALL_LEVERS) {
    const contributors: LeverContribution[] = []
    let rawSum = 0

    for (const capId of selectedIds) {
      const cap = CAPABILITY_BY_ID[capId]
      if (!cap) continue
      const scenario = args.selection[capId]
      const impact = cap.impacts.find((i) => i.lever === lever)
      if (!impact) continue

      const value = impact[scenario]
      rawSum += value
      contributors.push({
        capabilityId: cap.id,
        capabilityName: cap.name,
        scenario,
        contribution: value,
        rationale: impact.rationale,
      })
    }

    const cap = LEVER_CAPS[lever]
    const clamped = clamp(rawSum, cap.min, cap.max)
    const capped = clamped !== rawSum

    provenance[lever] = {
      lever,
      rawSum,
      value: clamped,
      capped,
      contributors,
    }
    assumptions[lever] = clamped
  }

  return {
    assumptions,
    provenance,
    selectedCapabilityIds: selectedIds,
  }
}

/**
 * Empty derivation — used when no capabilities are selected. All levers zero,
 * empty contributor lists, costs pass through.
 */
export function emptyDerivation(args: {
  annualPlatformCost?: number
  oneTimeImplementationCost?: number
} = {}): DerivedAssumptions {
  return deriveAssumptions({
    selection: {},
    annualPlatformCost: args.annualPlatformCost ?? 0,
    oneTimeImplementationCost: args.oneTimeImplementationCost ?? 0,
  })
}
