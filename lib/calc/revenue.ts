import { metric, type Metric } from '@/lib/types/metric'

export function memberRevenue(args: {
  activeMembers: number
  purchaseFrequencyPerYear: number
  averageOrderValue: number
}): Metric {
  return metric({
    value:
      args.activeMembers * args.purchaseFrequencyPerYear * args.averageOrderValue,
    unit: 'currency',
    formula: 'activeMembers × purchaseFrequencyPerYear × averageOrderValue',
    inputs: {
      activeMembers: args.activeMembers,
      purchaseFrequencyPerYear: args.purchaseFrequencyPerYear,
      averageOrderValue: args.averageOrderValue,
    },
  })
}

export function grossMargin(args: {
  memberRevenue: number
  grossMarginPct: number
}): Metric {
  return metric({
    value: args.memberRevenue * args.grossMarginPct,
    unit: 'currency',
    formula: 'memberRevenue × grossMarginPct',
    inputs: {
      memberRevenue: args.memberRevenue,
      grossMarginPct: args.grossMarginPct,
    },
  })
}

export function rewardSpend(args: {
  memberRevenue: number
  rewardCostPctOfRevenue: number
}): Metric {
  return metric({
    value: args.memberRevenue * args.rewardCostPctOfRevenue,
    unit: 'currency',
    formula: 'memberRevenue × rewardCostPctOfRevenue',
    inputs: {
      memberRevenue: args.memberRevenue,
      rewardCostPctOfRevenue: args.rewardCostPctOfRevenue,
    },
  })
}
