import type { Metric } from './metric'

/**
 * Snapshot of program economics — same shape for current-state and future-state so
 * a side-by-side view is trivial. Every field carries its formula and inputs.
 *
 * Per-period totals are annualised by the calc engine using DiscoveryInput.timeframeMonths
 * so current vs future are directly comparable.
 */
export type EconomicsResult = {
  /** Outstanding-points × point-value. */
  pointsLiability: Metric

  /** Annual points issued (normalised from period). */
  annualPointsIssued: Metric

  /** Annual points redeemed (normalised from period). */
  annualPointsRedeemed: Metric

  /** Redeemed / issued, expressed 0–1. */
  redemptionRate: Metric

  /** Issued / redeemed; signals earn-burn health. */
  earnBurnRatio: Metric

  /** 1 − redemption rate. */
  breakageRate: Metric

  /** Estimated annual value of unredeemed points (upside, in currency). */
  breakageValue: Metric

  /** Annual cost of redeemed points (points × value), in currency. */
  redemptionCost: Metric

  /** Reward / promo spend as a portion of member revenue. */
  rewardSpend: Metric

  /** Total annual member-driven revenue (active members × frequency × AOV). */
  memberRevenue: Metric

  /** Gross margin on member revenue, before program cost. */
  grossMargin: Metric

  /** Active member count used in calcs. */
  activeMembers: Metric
}
