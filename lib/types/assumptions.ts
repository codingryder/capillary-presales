/**
 * Future-state levers applied on top of current-state economics to model what
 * Capillary delivers. Every lever is editable in the UI and labeled as an assumption.
 *
 * Defaults are PLACEHOLDERS — they MUST be calibrated with a Capillary SA / finance
 * before any external demo. Per CLAUDE.md, do not treat these as ground truth.
 */
export type Assumptions = {
  /** Absolute uplift to redemption rate, in percentage points (e.g. 0.05 = +5pp). */
  redemptionRateUpliftPp: number

  /** Multiplicative uplift to member retention → translates to active-base growth (e.g. 0.10 = +10%). */
  retentionUpliftPct: number

  /** Multiplicative uplift to purchase frequency (e.g. 0.08 = +8%). */
  frequencyUpliftPct: number

  /** Multiplicative uplift to average order value (e.g. 0.05 = +5%). */
  aovUpliftPct: number

  /** Multiplicative change to reward-cost-as-%-of-revenue (negative = optimisation, e.g. -0.10 = 10% cheaper). */
  rewardCostDeltaPct: number

  /** One-time annual platform / subscription cost for Capillary, in local currency. */
  annualPlatformCost: number

  /** One-time implementation cost, in local currency. */
  oneTimeImplementationCost: number
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  redemptionRateUpliftPp: 0.05,
  retentionUpliftPct: 0.08,
  frequencyUpliftPct: 0.06,
  aovUpliftPct: 0.04,
  rewardCostDeltaPct: -0.05,
  annualPlatformCost: 0,
  oneTimeImplementationCost: 0,
}

/**
 * Human-readable labels for the assumptions UI. Keep in sync with the type.
 */
export const ASSUMPTION_LABELS: Record<keyof Assumptions, string> = {
  redemptionRateUpliftPp: 'Redemption rate uplift (percentage points)',
  retentionUpliftPct: 'Retention uplift (%)',
  frequencyUpliftPct: 'Purchase frequency uplift (%)',
  aovUpliftPct: 'Average order value uplift (%)',
  rewardCostDeltaPct: 'Reward cost change (% of revenue, negative = optimisation)',
  annualPlatformCost: 'Annual Capillary platform cost (local currency)',
  oneTimeImplementationCost: 'One-time implementation cost (local currency)',
}
