/**
 * The typed shape captured during discovery. Every field is optional so the SA can
 * save partial information; calc engine flags which fields are missing for each
 * metric so uncertainty is explicit.
 *
 * The LLM extraction path produces this same shape from pasted notes / transcripts;
 * the SA reviews and corrects before anything is computed.
 */
export type DiscoveryInput = {
  prospect?: ProspectMeta

  program?: ProgramMeta

  members?: MembersShape

  /**
   * Period over which `pointsIssued` and `pointsRedeemed` are measured.
   * Almost everything else is normalised to annual using this.
   */
  timeframeMonths?: number

  pointsIssued?: number
  pointsRedeemed?: number

  /** Outstanding (unredeemed, unexpired) point balance — the liability headline. */
  outstandingPoints?: number

  /** Local-currency value of one point at redemption (e.g. ₹0.10 → 0.10). */
  pointValue?: number

  expiryMonths?: number

  /** Average order value, in local currency. */
  averageOrderValue?: number

  /** Average purchases per member per year. */
  purchaseFrequencyPerYear?: number

  /** Reward / promotion cost as a share of member revenue (0–1). */
  rewardCostPctOfRevenue?: number

  /** Gross margin on member revenue (0–1). */
  grossMarginPct?: number

  /** Annual revenue driven by members (in local currency). If absent, derived from members × freq × AOV. */
  annualMemberRevenue?: number

  /** Active channels the program runs across. */
  channels?: Channel[]

  /** Optional free-text notes from the call. Useful context for narrative. */
  notes?: string
}

export type ProspectMeta = {
  name?: string
  industry?: string
  region?: string
  /** ISO 4217 — e.g. 'INR', 'USD', 'AED'. */
  currency?: string
}

export type ProgramMeta = {
  name?: string
  /** Current vendor or 'in-house' if homegrown. */
  vendor?: string
  launchYear?: number
  tiers?: Tier[]
}

export type Tier = {
  name: string
  /** Threshold in local currency or points; free-form, label only. */
  threshold?: string
  members?: number
}

export type MembersShape = {
  total?: number
  active?: number
  lapsed?: number
}

export type Channel = 'web' | 'app' | 'pos' | 'callcenter' | 'partner' | 'other'

/**
 * Fields that the calc engine considers minimally required to compute current-state
 * economics. Missing fields surface in `BusinessCase.missingInputs` so the SA knows
 * what's driving uncertainty.
 */
export const REQUIRED_FOR_CURRENT_STATE = [
  'members.active',
  'pointsIssued',
  'pointsRedeemed',
  'pointValue',
  'averageOrderValue',
  'purchaseFrequencyPerYear',
  'grossMarginPct',
] as const
