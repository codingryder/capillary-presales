import type { Capability } from '@/lib/types/capability'

/**
 * v0 Capillary capability catalog.
 *
 * THESE NUMBERS ARE PLACEHOLDERS. They are best-guess plausible ranges for an
 * enterprise loyalty platform — NOT sourced from Capillary's own engagements
 * or finance modelling. They MUST be replaced by an SA / product reviewer
 * before any external use.
 *
 * Convention: impacts are stored as fractions (0.04 = 4%) or percentage-points
 * (0.02 = 2pp for redemption). low ≤ mid ≤ high. Negative impacts (e.g.
 * reward cost optimisation) follow the same convention — `rewardCostDeltaPct`
 * impacts are stored as negative numbers.
 *
 * Range bands chosen so a single capability moves a lever by a small amount
 * (1-3pp redemption, 1-5% retention etc), and the sum is capped per-lever in
 * `LEVER_CAPS` to prevent unrealistic stacking.
 */
export const CAPABILITY_CATALOG: Capability[] = [
  // ──────────────────────────────────────────────────────────────────
  // Engagement & journeys
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'personalised-earn',
    name: 'Personalised earn accelerators',
    category: 'engagement',
    description:
      'Category-, SKU-, or campaign-level earn multipliers targeted to segments.',
    addresses: ['no-personalisation', 'weak-app-engagement'],
    impacts: [
      {
        lever: 'redemptionRateUpliftPp',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Relevant earn boosts redemption intent on targeted SKUs.',
      },
      {
        lever: 'frequencyUpliftPct',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Personalised earn pulls additional category visits.',
      },
    ],
  },
  {
    id: 'realtime-triggers',
    name: 'Real-time event-triggered campaigns',
    category: 'engagement',
    description:
      'Sub-minute response to in-session signals (cart abandon, tier-edge, location).',
    addresses: ['manual-campaigns', 'no-real-time-events'],
    impacts: [
      {
        lever: 'frequencyUpliftPct',
        low: 0.02,
        mid: 0.03,
        high: 0.04,
        rationale: 'In-the-moment nudges convert visit intent more often.',
      },
      {
        lever: 'aovUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Tier-edge prompts lift basket size near thresholds.',
      },
    ],
  },
  {
    id: 'gamified-challenges',
    name: 'Gamified challenges & streaks',
    category: 'engagement',
    description:
      'Time-bound challenges, streak rewards, milestone badges driving repeated app opens.',
    addresses: ['weak-app-engagement', 'lapsing-members'],
    impacts: [
      {
        lever: 'frequencyUpliftPct',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Streaks create habitual visit cadence among active users.',
      },
      {
        lever: 'retentionUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.04,
        rationale: 'Streak loss aversion reduces drop-off.',
      },
    ],
  },
  {
    id: 'surprise-delight',
    name: 'Surprise & delight automation',
    category: 'engagement',
    description:
      'Low-cost, high-perceived-value rewards triggered by member milestones.',
    addresses: ['weak-app-engagement', 'lapsing-members'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.01,
        mid: 0.025,
        high: 0.04,
        rationale: 'Unexpected positive moments lift NPS / retention.',
      },
      {
        lever: 'rewardCostDeltaPct',
        low: -0.02,
        mid: -0.01,
        high: 0,
        rationale:
          'Targeted surprise rewards are cheaper per retained member than broad promo.',
      },
    ],
  },
  {
    id: 'journey-orchestration',
    name: 'Customer journey orchestration',
    category: 'engagement',
    description:
      'Multi-step, multi-channel journeys with branching logic and frequency caps.',
    addresses: ['manual-campaigns', 'no-personalisation'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.035,
        rationale: 'Cohesive cross-channel journeys reduce attrition.',
      },
      {
        lever: 'frequencyUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.035,
        rationale: 'Right-message-right-channel improves response rates.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // Program mechanics
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'soft-tier-mechanics',
    name: 'Tiered status with soft-tier mechanics',
    category: 'mechanics',
    description:
      'Status-keep windows, soft-demotion, grace periods, fast-track challenges.',
    addresses: ['static-tier-mechanics', 'lapsing-members'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.03,
        mid: 0.05,
        high: 0.07,
        rationale:
          'Status-loss aversion is one of the most reliable retention levers.',
      },
      {
        lever: 'frequencyUpliftPct',
        low: 0.02,
        mid: 0.03,
        high: 0.045,
        rationale: 'Members spend more to keep / reach status.',
      },
    ],
  },
  {
    id: 'wallet-instant-redemption',
    name: 'Loyalty wallet & instant redemption',
    category: 'mechanics',
    description:
      'In-checkout point use; SKU-level redemption; no separate redemption flow.',
    addresses: ['low-redemption', 'weak-app-engagement'],
    impacts: [
      {
        lever: 'redemptionRateUpliftPp',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Friction removal is the #1 driver of redemption uplift.',
      },
      {
        lever: 'frequencyUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Visible point balance prompts incremental visits.',
      },
    ],
  },
  {
    id: 'family-coalition',
    name: 'Family / coalition accounts',
    category: 'mechanics',
    description:
      'Shared point pools across linked members, household-level recognition.',
    addresses: ['shared-spend-blind', 'lapsing-members'],
    impacts: [
      {
        lever: 'aovUpliftPct',
        low: 0.015,
        mid: 0.025,
        high: 0.04,
        rationale: 'Household consolidation grows captured share of wallet.',
      },
      {
        lever: 'retentionUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Multiple anchored members reduces household churn risk.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // Analytics & AI
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'rfm-segmentation',
    name: 'RFM / cohort segmentation',
    category: 'analytics',
    description:
      'Recency-frequency-monetary segments + cohort behaviour rollups, exposed to campaigns.',
    addresses: ['poor-segmentation', 'weak-analytics'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.035,
        rationale: 'Better targeting of at-risk cohorts.',
      },
      {
        lever: 'aovUpliftPct',
        low: 0.005,
        mid: 0.015,
        high: 0.025,
        rationale: 'High-value segments receive matched offers.',
      },
      {
        lever: 'rewardCostDeltaPct',
        low: -0.03,
        mid: -0.02,
        high: -0.01,
        rationale: 'Tighter targeting drops wasted promo spend.',
      },
    ],
  },
  {
    id: 'ai-nbo',
    name: 'AI next-best-offer',
    category: 'analytics',
    description:
      'Per-member offer ranking model that picks the highest-EV reward at decision time.',
    addresses: ['no-personalisation', 'high-reward-cost'],
    impacts: [
      {
        lever: 'aovUpliftPct',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Right offer increases basket completion and add-ons.',
      },
      {
        lever: 'redemptionRateUpliftPp',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Relevant offers improve burn velocity.',
      },
      {
        lever: 'rewardCostDeltaPct',
        low: -0.05,
        mid: -0.035,
        high: -0.02,
        rationale: 'Spend goes to members who would convert vs. broad discounts.',
      },
    ],
  },
  {
    id: 'predictive-churn',
    name: 'Predictive churn & save offers',
    category: 'analytics',
    description:
      'Per-member churn probability with auto-routed save offers; budget guardrails.',
    addresses: ['lapsing-members', 'high-reward-cost'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Save offers reach members in the at-risk window.',
      },
      {
        lever: 'rewardCostDeltaPct',
        low: -0.03,
        mid: -0.02,
        high: -0.01,
        rationale:
          'Saves are paid only when probability × value justifies the offer.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // Channels & partners
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'omnichannel-earn-burn',
    name: 'Omnichannel earn / burn',
    category: 'channels',
    description:
      'Identity stitched across POS, web, app, call-centre, kiosk — same balance everywhere.',
    addresses: ['no-omnichannel'],
    impacts: [
      {
        lever: 'frequencyUpliftPct',
        low: 0.02,
        mid: 0.035,
        high: 0.05,
        rationale: 'Members visit more often when they can engage where they shop.',
      },
      {
        lever: 'redemptionRateUpliftPp',
        low: 0.01,
        mid: 0.025,
        high: 0.04,
        rationale: 'Friction-free redemption across channels grows burn.',
      },
    ],
  },
  {
    id: 'partner-network',
    name: 'Cross-brand partner network',
    category: 'channels',
    description:
      'Earn / burn at partner brands; coalition mechanics; API-led merchant integration.',
    addresses: ['limited-partner-ecosystem'],
    impacts: [
      {
        lever: 'frequencyUpliftPct',
        low: 0.015,
        mid: 0.025,
        high: 0.04,
        rationale: 'Earning at partners extends the program beyond direct visits.',
      },
      {
        lever: 'aovUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.035,
        rationale: 'Coalition members spend more across the family.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // Operations
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'breakage-optimisation',
    name: 'Breakage optimisation engine',
    category: 'operations',
    description:
      'Calibrated expiry policy, reminder cadences, low-balance pushes — manages the liability curve.',
    addresses: ['low-redemption', 'high-reward-cost'],
    impacts: [
      {
        lever: 'redemptionRateUpliftPp',
        low: 0.02,
        mid: 0.03,
        high: 0.045,
        rationale: 'Timely reminders convert dormant balances before expiry.',
      },
      {
        lever: 'rewardCostDeltaPct',
        low: -0.04,
        mid: -0.025,
        high: -0.01,
        rationale: 'Better expiry calibration reduces ongoing accrual cost.',
      },
    ],
  },
  {
    id: 'winback-automation',
    name: 'Win-back / lapsed automation',
    category: 'operations',
    description:
      'Multi-touch win-back journeys for members in defined lapse windows.',
    addresses: ['lapsing-members'],
    impacts: [
      {
        lever: 'retentionUpliftPct',
        low: 0.015,
        mid: 0.03,
        high: 0.05,
        rationale: 'Reactivates measurable share of recently lapsed.',
      },
      {
        lever: 'frequencyUpliftPct',
        low: 0.01,
        mid: 0.02,
        high: 0.03,
        rationale: 'Reactivated members contribute incremental visits.',
      },
    ],
  },
  {
    id: 'compliance-expiry-policy',
    name: 'Compliance & expiry policy engine',
    category: 'operations',
    description:
      'Per-jurisdiction expiry rules, escheatment, audit trail, consent-aware messaging.',
    addresses: ['compliance-gaps', 'high-reward-cost'],
    impacts: [
      {
        lever: 'rewardCostDeltaPct',
        low: -0.02,
        mid: -0.01,
        high: 0,
        rationale:
          'Defensible expiry policy reduces over-accrual without legal risk.',
      },
    ],
  },
]

export const CAPABILITY_BY_ID: Record<string, Capability> =
  Object.fromEntries(CAPABILITY_CATALOG.map((c) => [c.id, c]))

export function capabilitiesForRequirement(req: string): Capability[] {
  return CAPABILITY_CATALOG.filter((c) =>
    c.addresses.includes(req as never),
  )
}
