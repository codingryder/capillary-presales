import { metric, type Metric } from '@/lib/types/metric'
import type { Assumptions } from '@/lib/types/assumptions'
import type { DiscoveryInput } from '@/lib/types/discovery'
import type { EconomicsResult } from '@/lib/types/economics'
import { computeCurrentState } from './current-state'
import { breakageValue, redemptionCost } from './redemption'
import { grossMargin, memberRevenue, rewardSpend } from './revenue'
import { isComputed, missingMetric } from './util'

export type FutureStateOutput = {
  result: EconomicsResult
  missing: string[]
}

/**
 * Apply assumptions to the discovery input and re-derive the EconomicsResult.
 *
 * Mental model:
 *  - Active member base grows by retentionUpliftPct.
 *  - Frequency × AOV grow by their respective uplift levers → memberRevenue grows.
 *  - Issuance is held proportional to memberRevenue (constant pointsPerCurrency).
 *  - Redemption rate gains an absolute uplift in percentage points (capped at 1).
 *  - Reward-cost-as-%-of-revenue moves by rewardCostDeltaPct (negative = optimisation).
 *  - pointsLiability is a balance-sheet stock — held flat to the current snapshot.
 */
export function computeFutureState(
  d: DiscoveryInput,
  a: Assumptions,
): FutureStateOutput {
  const { result: current, missing } = computeCurrentState(d)

  const activeMembers = d.members?.active
  const freq = d.purchaseFrequencyPerYear
  const aov = d.averageOrderValue
  const grossMarginPct = d.grossMarginPct
  const rewardCostPct = d.rewardCostPctOfRevenue
  const pointValue = d.pointValue

  const futureActive =
    activeMembers != null ? activeMembers * (1 + a.retentionUpliftPct) : undefined
  const futureFreq =
    freq != null ? freq * (1 + a.frequencyUpliftPct) : undefined
  const futureAov =
    aov != null ? aov * (1 + a.aovUpliftPct) : undefined

  // memberRevenue (future)
  let memberRevenueM: Metric
  if (futureActive != null && futureFreq != null && futureAov != null) {
    memberRevenueM = memberRevenue({
      activeMembers: futureActive,
      purchaseFrequencyPerYear: futureFreq,
      averageOrderValue: futureAov,
    })
    memberRevenueM = {
      ...memberRevenueM,
      formula:
        'futureActive × futureFreq × futureAOV ' +
        '(active × (1+retentionUpliftPct), freq × (1+frequencyUpliftPct), aov × (1+aovUpliftPct))',
      inputs: {
        ...memberRevenueM.inputs,
        retentionUpliftPct: a.retentionUpliftPct,
        frequencyUpliftPct: a.frequencyUpliftPct,
        aovUpliftPct: a.aovUpliftPct,
      },
    }
  } else {
    memberRevenueM = missingMetric({
      unit: 'currency',
      formula: 'futureActive × futureFreq × futureAOV',
      missing: [
        ...(futureActive == null ? ['members.active'] : []),
        ...(futureFreq == null ? ['purchaseFrequencyPerYear'] : []),
        ...(futureAov == null ? ['averageOrderValue'] : []),
      ],
    })
  }

  // gross margin (future, margin% unchanged)
  let grossMarginM: Metric
  if (grossMarginPct != null && isComputed(memberRevenueM)) {
    grossMarginM = grossMargin({
      memberRevenue: memberRevenueM.value as number,
      grossMarginPct,
    })
  } else {
    grossMarginM = missingMetric({
      unit: 'currency',
      formula: 'futureMemberRevenue × grossMarginPct',
      missing: [
        ...(grossMarginPct == null ? ['grossMarginPct'] : []),
        ...(isComputed(memberRevenueM) ? [] : ['futureMemberRevenue']),
      ],
    })
  }

  // reward spend (future, with rewardCostDeltaPct applied to the % of revenue)
  let rewardSpendM: Metric
  if (rewardCostPct != null && isComputed(memberRevenueM)) {
    const futureRewardCostPct = rewardCostPct * (1 + a.rewardCostDeltaPct)
    rewardSpendM = rewardSpend({
      memberRevenue: memberRevenueM.value as number,
      rewardCostPctOfRevenue: futureRewardCostPct,
    })
    rewardSpendM = {
      ...rewardSpendM,
      formula:
        'futureMemberRevenue × (rewardCostPctOfRevenue × (1 + rewardCostDeltaPct))',
      inputs: {
        ...rewardSpendM.inputs,
        rewardCostDeltaPct: a.rewardCostDeltaPct,
        baseRewardCostPctOfRevenue: rewardCostPct,
      },
    }
  } else {
    rewardSpendM = missingMetric({
      unit: 'currency',
      formula:
        'futureMemberRevenue × (rewardCostPctOfRevenue × (1 + rewardCostDeltaPct))',
      missing: [
        ...(rewardCostPct == null ? ['rewardCostPctOfRevenue'] : []),
        ...(isComputed(memberRevenueM) ? [] : ['futureMemberRevenue']),
      ],
    })
  }

  // issuance scales with member revenue (constant pointsPerCurrency)
  const currentRevenueValue = current.memberRevenue.value as number
  const currentAnnualIssued = current.annualPointsIssued.value as number
  let annualIssuedM: Metric
  if (
    isComputed(current.memberRevenue) &&
    isComputed(current.annualPointsIssued) &&
    currentRevenueValue > 0 &&
    isComputed(memberRevenueM)
  ) {
    const pointsPerCurrency = currentAnnualIssued / currentRevenueValue
    annualIssuedM = metric({
      value: (memberRevenueM.value as number) * pointsPerCurrency,
      unit: 'points',
      formula:
        'futureMemberRevenue × (currentAnnualPointsIssued ÷ currentMemberRevenue)',
      inputs: {
        futureMemberRevenue: memberRevenueM.value as number,
        currentAnnualPointsIssued: currentAnnualIssued,
        currentMemberRevenue: currentRevenueValue,
      },
    })
  } else {
    annualIssuedM = missingMetric({
      unit: 'points',
      formula:
        'futureMemberRevenue × (currentAnnualPointsIssued ÷ currentMemberRevenue)',
      missing: ['currentMemberRevenue', 'currentAnnualPointsIssued', 'futureMemberRevenue'],
    })
  }

  // future redemption rate
  let redemptionRateM: Metric
  if (isComputed(current.redemptionRate)) {
    const futureRr = Math.min(
      1,
      (current.redemptionRate.value as number) + a.redemptionRateUpliftPp,
    )
    redemptionRateM = metric({
      value: futureRr,
      unit: 'ratio',
      formula:
        'min(1, currentRedemptionRate + redemptionRateUpliftPp)',
      inputs: {
        currentRedemptionRate: current.redemptionRate.value as number,
        redemptionRateUpliftPp: a.redemptionRateUpliftPp,
      },
    })
  } else {
    redemptionRateM = missingMetric({
      unit: 'ratio',
      formula: 'min(1, currentRedemptionRate + redemptionRateUpliftPp)',
      missing: ['currentRedemptionRate'],
    })
  }

  const breakageRateM: Metric = isComputed(redemptionRateM)
    ? metric({
        value: 1 - (redemptionRateM.value as number),
        unit: 'ratio',
        formula: '1 − futureRedemptionRate',
        inputs: { futureRedemptionRate: redemptionRateM.value as number },
      })
    : missingMetric({
        unit: 'ratio',
        formula: '1 − futureRedemptionRate',
        missing: ['futureRedemptionRate'],
      })

  // annual redeemed = future issued × future redemption rate
  let annualRedeemedM: Metric
  if (isComputed(annualIssuedM) && isComputed(redemptionRateM)) {
    annualRedeemedM = metric({
      value: (annualIssuedM.value as number) * (redemptionRateM.value as number),
      unit: 'points',
      formula: 'futureAnnualPointsIssued × futureRedemptionRate',
      inputs: {
        futureAnnualPointsIssued: annualIssuedM.value as number,
        futureRedemptionRate: redemptionRateM.value as number,
      },
    })
  } else {
    annualRedeemedM = missingMetric({
      unit: 'points',
      formula: 'futureAnnualPointsIssued × futureRedemptionRate',
      missing: ['futureAnnualPointsIssued', 'futureRedemptionRate'],
    })
  }

  // earn/burn
  const earnBurnM: Metric =
    isComputed(annualIssuedM) &&
    isComputed(annualRedeemedM) &&
    (annualRedeemedM.value as number) > 0
      ? metric({
          value:
            (annualIssuedM.value as number) /
            (annualRedeemedM.value as number),
          unit: 'ratio',
          formula: 'futureAnnualPointsIssued ÷ futureAnnualPointsRedeemed',
          inputs: {
            futureAnnualPointsIssued: annualIssuedM.value as number,
            futureAnnualPointsRedeemed: annualRedeemedM.value as number,
          },
        })
      : missingMetric({
          unit: 'ratio',
          formula: 'futureAnnualPointsIssued ÷ futureAnnualPointsRedeemed',
          missing: ['futureAnnualPointsIssued', 'futureAnnualPointsRedeemed > 0'],
        })

  // currency-denominated point flows
  const breakageValueM: Metric =
    pointValue != null && isComputed(annualIssuedM) && isComputed(breakageRateM)
      ? breakageValue({
          annualPointsIssued: annualIssuedM.value as number,
          breakageRate: breakageRateM.value as number,
          pointValue,
        })
      : missingMetric({
          unit: 'currency',
          formula: 'futureAnnualPointsIssued × futureBreakageRate × pointValue',
          missing: [
            ...(pointValue == null ? ['pointValue'] : []),
            ...(isComputed(annualIssuedM) ? [] : ['futureAnnualPointsIssued']),
            ...(isComputed(breakageRateM) ? [] : ['futureBreakageRate']),
          ],
        })

  const redemptionCostM: Metric =
    pointValue != null && isComputed(annualRedeemedM)
      ? redemptionCost({
          annualPointsRedeemed: annualRedeemedM.value as number,
          pointValue,
        })
      : missingMetric({
          unit: 'currency',
          formula: 'futureAnnualPointsRedeemed × pointValue',
          missing: [
            ...(pointValue == null ? ['pointValue'] : []),
            ...(isComputed(annualRedeemedM) ? [] : ['futureAnnualPointsRedeemed']),
          ],
        })

  // active members (future)
  const activeMembersM: Metric =
    futureActive != null
      ? metric({
          value: futureActive,
          unit: 'count',
          formula: 'currentActiveMembers × (1 + retentionUpliftPct)',
          inputs: {
            currentActiveMembers: activeMembers as number,
            retentionUpliftPct: a.retentionUpliftPct,
          },
        })
      : missingMetric({
          unit: 'count',
          formula: 'currentActiveMembers × (1 + retentionUpliftPct)',
          missing: ['members.active'],
        })

  const result: EconomicsResult = {
    pointsLiability: current.pointsLiability, // balance-sheet stock, held flat
    annualPointsIssued: annualIssuedM,
    annualPointsRedeemed: annualRedeemedM,
    redemptionRate: redemptionRateM,
    earnBurnRatio: earnBurnM,
    breakageRate: breakageRateM,
    breakageValue: breakageValueM,
    redemptionCost: redemptionCostM,
    rewardSpend: rewardSpendM,
    memberRevenue: memberRevenueM,
    grossMargin: grossMarginM,
    activeMembers: activeMembersM,
  }

  return { result, missing }
}
