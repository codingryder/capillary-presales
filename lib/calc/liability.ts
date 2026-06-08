import { metric, type Metric } from '@/lib/types/metric'

/**
 * Points liability — the headline balance-sheet figure for a loyalty program.
 * The program owes members this much value if every outstanding point were redeemed.
 */
export function pointsLiability(args: {
  outstandingPoints: number
  pointValue: number
}): Metric {
  const { outstandingPoints, pointValue } = args
  return metric({
    value: outstandingPoints * pointValue,
    unit: 'currency',
    formula: 'outstandingPoints × pointValue',
    inputs: { outstandingPoints, pointValue },
  })
}
