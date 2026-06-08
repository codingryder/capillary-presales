import type { Assumptions } from './assumptions'
import type { DerivedAssumptions } from './capability'
import type { DiscoveryInput } from './discovery'
import type { EconomicsResult } from './economics'
import type { Metric } from './metric'

/**
 * Full business-case payload that drives the export-ready view. Combines:
 *   - the structured inputs (so we can show "what we were told")
 *   - current-state economics
 *   - future-state economics (after assumptions applied)
 *   - the delta (per metric)
 *   - aggregate headline numbers
 *   - the editable assumptions used
 *   - any LLM-generated narrative prose
 *   - a list of missing inputs that drive uncertainty
 */
export type BusinessCase = {
  discovery: DiscoveryInput
  current: EconomicsResult
  future: EconomicsResult
  delta: BusinessCaseDelta
  headline: BusinessCaseHeadline
  assumptions: Assumptions
  /**
   * Optional. Set when the assumptions were derived from a CapabilitySelection
   * via `deriveAssumptions`. Carries the full provenance trail (which caps
   * contributed how much to each lever) so the UI / narrative can explain
   * the future state as "modelled on these N Capillary capabilities".
   */
  derivedAssumptions?: DerivedAssumptions
  narrative?: string
  missingInputs: string[]
}

/**
 * Future-minus-current for the metrics where a delta makes sense. Each is a Metric
 * so the UI shows the working.
 */
export type BusinessCaseDelta = {
  redemptionRate: Metric
  breakageValue: Metric
  memberRevenue: Metric
  grossMargin: Metric
  programCost: Metric
}

/**
 * Top-of-page headline numbers — what shows up on the executive summary slide.
 */
export type BusinessCaseHeadline = {
  /** Annual incremental margin delivered by moving to Capillary (currency). */
  annualUplift: Metric
  /** Cumulative 3-year incremental margin net of platform + implementation cost. */
  threeYearNetValue: Metric
  /** Months to recoup the one-time + first-year platform cost from incremental margin. */
  paybackMonths?: Metric
}
