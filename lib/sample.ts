import type { CapabilitySelection } from './types/capability'
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
  requirements: [
    'weak-app-engagement',
    'no-personalisation',
    'lapsing-members',
    'low-redemption',
    'static-tier-mechanics',
  ],
  notes:
    'Legacy in-house program, weak app engagement, no personalised earn — strong appetite for richer mechanics and breakage optimisation.',
}

/**
 * Sample capability selection that lines up with the SAMPLE_DISCOVERY
 * requirements above. Default all to the "mid" scenario.
 */
export const SAMPLE_CAPABILITY_SELECTION: CapabilitySelection = {
  'personalised-earn': 'mid',
  'gamified-challenges': 'mid',
  'wallet-instant-redemption': 'mid',
  'soft-tier-mechanics': 'mid',
  'breakage-optimisation': 'mid',
  'winback-automation': 'mid',
  'rfm-segmentation': 'mid',
}

export const SAMPLE_PLATFORM_COST = 5_000_000
export const SAMPLE_IMPL_COST = 10_000_000

export const EMPTY_DISCOVERY: DiscoveryInput = {
  prospect: { currency: 'INR' },
  timeframeMonths: 12,
}

export const EMPTY_CAPABILITY_SELECTION: CapabilitySelection = {}
