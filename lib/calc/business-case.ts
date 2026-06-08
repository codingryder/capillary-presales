import { metric, type Metric } from '@/lib/types/metric'
import { DEFAULT_ASSUMPTIONS, type Assumptions } from '@/lib/types/assumptions'
import type { DiscoveryInput } from '@/lib/types/discovery'
import type {
  BusinessCase,
  BusinessCaseDelta,
  BusinessCaseHeadline,
} from '@/lib/types/business-case'
import { computeCurrentState } from './current-state'
import { computeFutureState } from './future-state'
import { isComputed, missingMetric } from './util'

/**
 * Build the full BusinessCase from a DiscoveryInput and (optional) Assumptions.
 * Returns the current + future EconomicsResults, the per-metric delta, and the
 * headline numbers (annual uplift, 3-year net value, payback months).
 *
 * The headline annual uplift is:
 *   ΔgrossMargin − ΔrewardSpend − ΔredemptionCost − annualPlatformCost
 *
 * — i.e. the incremental margin Capillary delivers, net of incremental reward
 * spend and the Capillary platform fee. Implementation cost is amortised separately
 * into the 3-year net value and payback figures.
 */
export function buildBusinessCase(
  discovery: DiscoveryInput,
  assumptions: Assumptions = DEFAULT_ASSUMPTIONS,
): BusinessCase {
  const { result: current, missing: currentMissing } = computeCurrentState(discovery)
  const { result: future, missing: futureMissing } = computeFutureState(
    discovery,
    assumptions,
  )

  const missingInputs = Array.from(new Set([...currentMissing, ...futureMissing]))

  const deltaCurrency = (
    name: string,
    cur: Metric,
    fut: Metric,
    formula: string,
  ): Metric => {
    if (!isComputed(cur) || !isComputed(fut)) {
      return missingMetric({
        unit: 'currency',
        formula,
        missing: [`current.${name}`, `future.${name}`].filter(
          (_, i) =>
            (i === 0 && !isComputed(cur)) || (i === 1 && !isComputed(fut)),
        ),
      })
    }
    return metric({
      value: (fut.value as number) - (cur.value as number),
      unit: 'currency',
      formula,
      inputs: { current: cur.value as number, future: fut.value as number },
    })
  }

  const deltaRedemptionRateM: Metric =
    isComputed(current.redemptionRate) && isComputed(future.redemptionRate)
      ? metric({
          value:
            (future.redemptionRate.value as number) -
            (current.redemptionRate.value as number),
          unit: 'percent',
          formula: 'futureRedemptionRate − currentRedemptionRate',
          inputs: {
            current: current.redemptionRate.value as number,
            future: future.redemptionRate.value as number,
          },
        })
      : missingMetric({
          unit: 'percent',
          formula: 'futureRedemptionRate − currentRedemptionRate',
          missing: ['current.redemptionRate', 'future.redemptionRate'],
        })

  const deltaBreakageValueM = deltaCurrency(
    'breakageValue',
    current.breakageValue,
    future.breakageValue,
    'futureBreakageValue − currentBreakageValue',
  )
  const deltaMemberRevenueM = deltaCurrency(
    'memberRevenue',
    current.memberRevenue,
    future.memberRevenue,
    'futureMemberRevenue − currentMemberRevenue',
  )
  const deltaGrossMarginM = deltaCurrency(
    'grossMargin',
    current.grossMargin,
    future.grossMargin,
    'futureGrossMargin − currentGrossMargin',
  )

  // Δ programCost = Δ rewardSpend + Δ redemptionCost + annualPlatformCost
  let deltaProgramCostM: Metric
  if (
    isComputed(current.rewardSpend) &&
    isComputed(future.rewardSpend) &&
    isComputed(current.redemptionCost) &&
    isComputed(future.redemptionCost)
  ) {
    const dReward =
      (future.rewardSpend.value as number) - (current.rewardSpend.value as number)
    const dRedemption =
      (future.redemptionCost.value as number) -
      (current.redemptionCost.value as number)
    deltaProgramCostM = metric({
      value: dReward + dRedemption + assumptions.annualPlatformCost,
      unit: 'currency',
      formula:
        '(futureRewardSpend − currentRewardSpend) + (futureRedemptionCost − currentRedemptionCost) + annualPlatformCost',
      inputs: {
        dRewardSpend: dReward,
        dRedemptionCost: dRedemption,
        annualPlatformCost: assumptions.annualPlatformCost,
      },
    })
  } else {
    deltaProgramCostM = missingMetric({
      unit: 'currency',
      formula:
        '(futureRewardSpend − currentRewardSpend) + (futureRedemptionCost − currentRedemptionCost) + annualPlatformCost',
      missing: ['rewardSpend', 'redemptionCost'],
    })
  }

  const delta: BusinessCaseDelta = {
    redemptionRate: deltaRedemptionRateM,
    breakageValue: deltaBreakageValueM,
    memberRevenue: deltaMemberRevenueM,
    grossMargin: deltaGrossMarginM,
    programCost: deltaProgramCostM,
  }

  // Headline: annualUplift = ΔgrossMargin − ΔprogramCost (Δreward + Δredemption + platform)
  let annualUpliftM: Metric
  if (isComputed(deltaGrossMarginM) && isComputed(deltaProgramCostM)) {
    annualUpliftM = metric({
      value:
        (deltaGrossMarginM.value as number) -
        (deltaProgramCostM.value as number),
      unit: 'currency',
      formula: 'ΔgrossMargin − ΔprogramCost',
      inputs: {
        dGrossMargin: deltaGrossMarginM.value as number,
        dProgramCost: deltaProgramCostM.value as number,
      },
    })
  } else {
    annualUpliftM = missingMetric({
      unit: 'currency',
      formula: 'ΔgrossMargin − ΔprogramCost',
      missing: ['ΔgrossMargin', 'ΔprogramCost'],
    })
  }

  // 3-year net value = annualUplift × 3 − oneTimeImplementationCost
  const threeYearNetValueM: Metric = isComputed(annualUpliftM)
    ? metric({
        value:
          (annualUpliftM.value as number) * 3 -
          assumptions.oneTimeImplementationCost,
        unit: 'currency',
        formula: 'annualUplift × 3 − oneTimeImplementationCost',
        inputs: {
          annualUplift: annualUpliftM.value as number,
          oneTimeImplementationCost: assumptions.oneTimeImplementationCost,
        },
      })
    : missingMetric({
        unit: 'currency',
        formula: 'annualUplift × 3 − oneTimeImplementationCost',
        missing: ['annualUplift'],
      })

  // Payback months — only meaningful when annualUplift > 0 and there's a one-time cost
  let paybackMonthsM: Metric | undefined
  if (
    isComputed(annualUpliftM) &&
    (annualUpliftM.value as number) > 0 &&
    assumptions.oneTimeImplementationCost > 0
  ) {
    paybackMonthsM = metric({
      value:
        assumptions.oneTimeImplementationCost /
        ((annualUpliftM.value as number) / 12),
      unit: 'months',
      formula: 'oneTimeImplementationCost ÷ (annualUplift ÷ 12)',
      inputs: {
        oneTimeImplementationCost: assumptions.oneTimeImplementationCost,
        annualUplift: annualUpliftM.value as number,
      },
    })
  }

  const headline: BusinessCaseHeadline = {
    annualUplift: annualUpliftM,
    threeYearNetValue: threeYearNetValueM,
    ...(paybackMonthsM ? { paybackMonths: paybackMonthsM } : {}),
  }

  return {
    discovery,
    current,
    future,
    delta,
    headline,
    assumptions,
    missingInputs,
  }
}
