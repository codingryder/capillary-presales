import type { Assumptions } from './assumptions'
import type { RequirementCategory } from './requirements'

/**
 * Which of the seven Assumption levers a Capability can move.
 * `annualPlatformCost` and `oneTimeImplementationCost` are commercial inputs,
 * not capability-driven, so they're excluded.
 */
export type ImpactLever =
  | 'redemptionRateUpliftPp'
  | 'retentionUpliftPct'
  | 'frequencyUpliftPct'
  | 'aovUpliftPct'
  | 'rewardCostDeltaPct'

export type Scenario = 'low' | 'mid' | 'high'

/**
 * A single capability's impact on one lever. Carries low/mid/high so the SA
 * can pick the confidence band per-capability. Rationale is shown in the
 * derivation popover — keep it tight (one short sentence).
 */
export type CapabilityImpact = {
  lever: ImpactLever
  low: number
  mid: number
  high: number
  rationale: string
}

export type CapabilityCategory =
  | 'engagement'
  | 'mechanics'
  | 'analytics'
  | 'channels'
  | 'operations'

export const CATEGORY_LABELS: Record<CapabilityCategory, string> = {
  engagement: 'Engagement & journeys',
  mechanics: 'Program mechanics',
  analytics: 'Analytics & AI',
  channels: 'Channels & partners',
  operations: 'Operations',
}

export type Capability = {
  id: string
  name: string
  category: CapabilityCategory
  description: string
  /** Which discovery requirements this capability addresses (drives auto-suggest). */
  addresses: RequirementCategory[]
  impacts: CapabilityImpact[]
}

/**
 * The runtime selection map: capability id → which scenario the SA picked.
 * Absence from the map means the capability isn't selected.
 */
export type CapabilitySelection = Record<string, Scenario>

/**
 * Per-lever clamps applied to the summed contribution from all selected
 * capabilities. Prevents 10 capabilities × 2pp = 20pp from looking absurd
 * to a finance reviewer.
 *
 * Bounds chosen as plausible upper limits for what an enterprise loyalty
 * redesign can credibly deliver — e.g. moving redemption rate by more than
 * 15pp in one program redesign is rare and would itself need defending.
 *
 * These are placeholders pending SA / finance calibration — same flag as
 * the rest of the model.
 */
export const LEVER_CAPS: Record<ImpactLever, { min: number; max: number }> = {
  redemptionRateUpliftPp: { min: 0, max: 0.15 }, // up to +15pp
  retentionUpliftPct: { min: 0, max: 0.2 }, // up to +20%
  frequencyUpliftPct: { min: 0, max: 0.2 }, // up to +20%
  aovUpliftPct: { min: 0, max: 0.15 }, // up to +15%
  rewardCostDeltaPct: { min: -0.15, max: 0 }, // up to -15% (optimisation), never positive
}

/**
 * Per-lever contributor breakdown — drives the "show the derivation" popover
 * on each derived Assumption lever.
 */
export type LeverContribution = {
  capabilityId: string
  capabilityName: string
  scenario: Scenario
  contribution: number
  rationale: string
}

export type LeverProvenance = {
  lever: ImpactLever
  /** Sum before clamping (what would have been if there were no cap). */
  rawSum: number
  /** Final value after clamping to LEVER_CAPS. */
  value: number
  /** Whether the cap kicked in. */
  capped: boolean
  contributors: LeverContribution[]
}

/**
 * Output of the derivation step — the assumption set the calc engine consumes,
 * plus the provenance trail for each lever.
 */
export type DerivedAssumptions = {
  assumptions: Assumptions
  provenance: Record<ImpactLever, LeverProvenance>
  selectedCapabilityIds: string[]
}
