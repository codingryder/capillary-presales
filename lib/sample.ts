import { DEFAULT_ASSUMPTIONS, type Assumptions } from './types/assumptions'
import type { DiscoveryInput } from './types/discovery'

/**
 * Demo / sample discovery payload used by the "Load sample" button and by the
 * calc-engine tests. Round numbers chosen so a reviewer can verify the math by
 * inspection — see lib/calc/current-state.test.ts and business-case.test.ts.
 */
export const SAMPLE_DISCOVERY: DiscoveryInput = {
  prospect: {
    name: 'Acme Retail',
    industry: 'Fashion & Apparel',
    region: 'India',
    currency: 'INR',
  },
  program: {
    name: 'Acme Rewards',
    vendor: 'in-house',
    launchYear: 2019,
  },
  members: { total: 250_000, active: 100_000, lapsed: 150_000 },
  timeframeMonths: 6,
  pointsIssued: 50_000_000,
  pointsRedeemed: 20_000_000,
  outstandingPoints: 30_000_000,
  pointValue: 0.1,
  expiryMonths: 24,
  averageOrderValue: 500,
  purchaseFrequencyPerYear: 4,
  grossMarginPct: 0.3,
  rewardCostPctOfRevenue: 0.05,
  channels: ['web', 'app', 'pos'],
  notes:
    'Legacy in-house program, weak app engagement, no personalised earn — strong appetite for richer mechanics and breakage optimisation.',
}

/**
 * Illustrative future-state lever set that lines up with the worked example in
 * the business-case tests. Distinct from DEFAULT_ASSUMPTIONS so the user can
 * load it as a "demo scenario" and still have unedited DEFAULT_ASSUMPTIONS to
 * fall back to.
 */
export const SAMPLE_ASSUMPTIONS: Assumptions = {
  redemptionRateUpliftPp: 0.1,
  retentionUpliftPct: 0.1,
  frequencyUpliftPct: 0.05,
  aovUpliftPct: 0.05,
  rewardCostDeltaPct: -0.2,
  annualPlatformCost: 5_000_000,
  oneTimeImplementationCost: 10_000_000,
}

export const EMPTY_DISCOVERY: DiscoveryInput = {
  prospect: { currency: 'INR' },
  timeframeMonths: 12,
}

export const EMPTY_ASSUMPTIONS: Assumptions = { ...DEFAULT_ASSUMPTIONS }
