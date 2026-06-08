/**
 * Common discovery findings about a prospect's current loyalty program.
 * Used by the capability-mapping layer to auto-suggest which Capillary
 * capabilities address what was raised in the call. Also extractable
 * from notes by the LLM via /api/extract.
 */
export type RequirementCategory =
  | 'weak-app-engagement'
  | 'no-personalisation'
  | 'lapsing-members'
  | 'high-reward-cost'
  | 'static-tier-mechanics'
  | 'no-omnichannel'
  | 'limited-partner-ecosystem'
  | 'poor-segmentation'
  | 'low-redemption'
  | 'manual-campaigns'
  | 'no-real-time-events'
  | 'compliance-gaps'
  | 'weak-analytics'
  | 'shared-spend-blind'

export const REQUIREMENT_LABELS: Record<RequirementCategory, string> = {
  'weak-app-engagement': 'Weak app / digital engagement',
  'no-personalisation': 'No personalisation in earn / offers',
  'lapsing-members': 'High lapse / churn among members',
  'high-reward-cost': 'High reward / promo cost',
  'static-tier-mechanics': 'Static, stale tier mechanics',
  'no-omnichannel': 'No omnichannel earn / burn',
  'limited-partner-ecosystem': 'No partner / coalition ecosystem',
  'poor-segmentation': 'Poor segmentation / cohort logic',
  'low-redemption': 'Low redemption rate / liability overhang',
  'manual-campaigns': 'Manual / batch campaign workflow',
  'no-real-time-events': 'No real-time / event-triggered journeys',
  'compliance-gaps': 'Compliance / expiry policy gaps',
  'weak-analytics': 'Weak analytics / member-level economics',
  'shared-spend-blind': 'No coalition / family / shared-spend mechanics',
}

export const ALL_REQUIREMENTS: RequirementCategory[] = Object.keys(
  REQUIREMENT_LABELS,
) as RequirementCategory[]
