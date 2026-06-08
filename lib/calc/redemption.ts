import { metric, type Metric } from '@/lib/types/metric'
import { annualMultiplier } from './util'

export function annualPointsIssued(args: {
  pointsIssued: number
  timeframeMonths: number
}): Metric {
  const mult = annualMultiplier(args.timeframeMonths)
  return metric({
    value: args.pointsIssued * mult,
    unit: 'points',
    formula: 'pointsIssued × (12 / timeframeMonths)',
    inputs: { pointsIssued: args.pointsIssued, timeframeMonths: args.timeframeMonths },
  })
}

export function annualPointsRedeemed(args: {
  pointsRedeemed: number
  timeframeMonths: number
}): Metric {
  const mult = annualMultiplier(args.timeframeMonths)
  return metric({
    value: args.pointsRedeemed * mult,
    unit: 'points',
    formula: 'pointsRedeemed × (12 / timeframeMonths)',
    inputs: { pointsRedeemed: args.pointsRedeemed, timeframeMonths: args.timeframeMonths },
  })
}

/**
 * Redemption rate is timeframe-independent — the period multiplier cancels out.
 */
export function redemptionRate(args: {
  pointsIssued: number
  pointsRedeemed: number
}): Metric {
  if (args.pointsIssued <= 0) {
    throw new Error('pointsIssued must be > 0 to compute redemptionRate')
  }
  return metric({
    value: args.pointsRedeemed / args.pointsIssued,
    unit: 'ratio',
    formula: 'pointsRedeemed ÷ pointsIssued',
    inputs: { pointsIssued: args.pointsIssued, pointsRedeemed: args.pointsRedeemed },
  })
}

export function earnBurnRatio(args: {
  pointsIssued: number
  pointsRedeemed: number
}): Metric {
  if (args.pointsRedeemed <= 0) {
    throw new Error('pointsRedeemed must be > 0 to compute earnBurnRatio')
  }
  return metric({
    value: args.pointsIssued / args.pointsRedeemed,
    unit: 'ratio',
    formula: 'pointsIssued ÷ pointsRedeemed',
    inputs: { pointsIssued: args.pointsIssued, pointsRedeemed: args.pointsRedeemed },
  })
}

export function breakageRate(args: {
  pointsIssued: number
  pointsRedeemed: number
}): Metric {
  if (args.pointsIssued <= 0) {
    throw new Error('pointsIssued must be > 0 to compute breakageRate')
  }
  return metric({
    value: 1 - args.pointsRedeemed / args.pointsIssued,
    unit: 'ratio',
    formula: '1 − (pointsRedeemed ÷ pointsIssued)',
    inputs: { pointsIssued: args.pointsIssued, pointsRedeemed: args.pointsRedeemed },
  })
}

/**
 * Annualised value of points expected never to be redeemed.
 * Useful as a sanity-check on liability — high breakage value = high upside but
 * also means a lot of accrued promise the program never delivered on.
 */
export function breakageValue(args: {
  annualPointsIssued: number
  breakageRate: number
  pointValue: number
}): Metric {
  return metric({
    value: args.annualPointsIssued * args.breakageRate * args.pointValue,
    unit: 'currency',
    formula: 'annualPointsIssued × breakageRate × pointValue',
    inputs: {
      annualPointsIssued: args.annualPointsIssued,
      breakageRate: args.breakageRate,
      pointValue: args.pointValue,
    },
  })
}

/**
 * Annual cost of points that are actually redeemed.
 */
export function redemptionCost(args: {
  annualPointsRedeemed: number
  pointValue: number
}): Metric {
  return metric({
    value: args.annualPointsRedeemed * args.pointValue,
    unit: 'currency',
    formula: 'annualPointsRedeemed × pointValue',
    inputs: {
      annualPointsRedeemed: args.annualPointsRedeemed,
      pointValue: args.pointValue,
    },
  })
}
