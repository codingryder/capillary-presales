import { metric, type Metric } from '@/lib/types/metric'
import type { DiscoveryInput } from '@/lib/types/discovery'
import type { EconomicsResult } from '@/lib/types/economics'
import { pointsLiability } from './liability'
import {
  annualPointsIssued,
  annualPointsRedeemed,
  breakageRate,
  breakageValue,
  earnBurnRatio,
  redemptionCost,
  redemptionRate,
} from './redemption'
import { grossMargin, memberRevenue, rewardSpend } from './revenue'
import { missingMetric } from './util'

export type CurrentStateOutput = {
  result: EconomicsResult
  missing: string[]
}

/**
 * Compose current-state economics from a (potentially partial) DiscoveryInput.
 * Each metric is either computed from its required inputs or replaced with a
 * `missingMetric` placeholder; the names of fields driving the gaps are returned
 * in `missing` so the UI can surface them to the SA.
 */
export function computeCurrentState(d: DiscoveryInput): CurrentStateOutput {
  const missing: string[] = []
  const need = (label: string) => {
    if (!missing.includes(label)) missing.push(label)
  }

  const timeframeMonths = d.timeframeMonths ?? 12
  const pointValue = d.pointValue
  const pointsIssued = d.pointsIssued
  const pointsRedeemed = d.pointsRedeemed
  const outstandingPoints = d.outstandingPoints
  const activeMembers = d.members?.active
  const aov = d.averageOrderValue
  const freq = d.purchaseFrequencyPerYear
  const grossMarginPct = d.grossMarginPct
  const rewardCostPct = d.rewardCostPctOfRevenue
  const givenAnnualMemberRevenue = d.annualMemberRevenue

  // Liability
  let liabilityM: Metric
  if (outstandingPoints != null && pointValue != null) {
    liabilityM = pointsLiability({ outstandingPoints, pointValue })
  } else {
    if (outstandingPoints == null) need('outstandingPoints')
    if (pointValue == null) need('pointValue')
    liabilityM = missingMetric({
      unit: 'currency',
      formula: 'outstandingPoints × pointValue',
      missing: [
        ...(outstandingPoints == null ? ['outstandingPoints'] : []),
        ...(pointValue == null ? ['pointValue'] : []),
      ],
    })
  }

  // Annualised issuance / redemption
  let annualIssuedM: Metric
  let annualRedeemedM: Metric
  if (pointsIssued != null) {
    annualIssuedM = annualPointsIssued({ pointsIssued, timeframeMonths })
  } else {
    need('pointsIssued')
    annualIssuedM = missingMetric({
      unit: 'points',
      formula: 'pointsIssued × (12 / timeframeMonths)',
      missing: ['pointsIssued'],
    })
  }
  if (pointsRedeemed != null) {
    annualRedeemedM = annualPointsRedeemed({ pointsRedeemed, timeframeMonths })
  } else {
    need('pointsRedeemed')
    annualRedeemedM = missingMetric({
      unit: 'points',
      formula: 'pointsRedeemed × (12 / timeframeMonths)',
      missing: ['pointsRedeemed'],
    })
  }

  // Rates (timeframe-independent)
  let redemptionRateM: Metric
  let breakageRateM: Metric
  let earnBurnM: Metric
  if (pointsIssued != null && pointsRedeemed != null && pointsIssued > 0) {
    redemptionRateM = redemptionRate({ pointsIssued, pointsRedeemed })
    breakageRateM = breakageRate({ pointsIssued, pointsRedeemed })
    earnBurnM =
      pointsRedeemed > 0
        ? earnBurnRatio({ pointsIssued, pointsRedeemed })
        : missingMetric({
            unit: 'ratio',
            formula: 'pointsIssued ÷ pointsRedeemed',
            missing: ['pointsRedeemed > 0'],
          })
  } else {
    redemptionRateM = missingMetric({
      unit: 'percent',
      formula: 'pointsRedeemed ÷ pointsIssued',
      missing: ['pointsIssued', 'pointsRedeemed'],
    })
    breakageRateM = missingMetric({
      unit: 'percent',
      formula: '1 − (pointsRedeemed ÷ pointsIssued)',
      missing: ['pointsIssued', 'pointsRedeemed'],
    })
    earnBurnM = missingMetric({
      unit: 'ratio',
      formula: 'pointsIssued ÷ pointsRedeemed',
      missing: ['pointsIssued', 'pointsRedeemed'],
    })
  }

  // Currency-denominated point flows
  let breakageValueM: Metric
  let redemptionCostM: Metric
  if (
    pointValue != null &&
    Number.isFinite(annualIssuedM.value as number) &&
    Number.isFinite(breakageRateM.value as number)
  ) {
    breakageValueM = breakageValue({
      annualPointsIssued: annualIssuedM.value as number,
      breakageRate: breakageRateM.value as number,
      pointValue,
    })
  } else {
    if (pointValue == null) need('pointValue')
    breakageValueM = missingMetric({
      unit: 'currency',
      formula: 'annualPointsIssued × breakageRate × pointValue',
      missing: [
        ...(pointValue == null ? ['pointValue'] : []),
        ...(Number.isFinite(annualIssuedM.value as number) ? [] : ['annualPointsIssued']),
        ...(Number.isFinite(breakageRateM.value as number) ? [] : ['breakageRate']),
      ],
    })
  }
  if (pointValue != null && Number.isFinite(annualRedeemedM.value as number)) {
    redemptionCostM = redemptionCost({
      annualPointsRedeemed: annualRedeemedM.value as number,
      pointValue,
    })
  } else {
    if (pointValue == null) need('pointValue')
    redemptionCostM = missingMetric({
      unit: 'currency',
      formula: 'annualPointsRedeemed × pointValue',
      missing: [
        ...(pointValue == null ? ['pointValue'] : []),
        ...(Number.isFinite(annualRedeemedM.value as number) ? [] : ['annualPointsRedeemed']),
      ],
    })
  }

  // Revenue / margin
  let memberRevenueM: Metric
  if (givenAnnualMemberRevenue != null) {
    memberRevenueM = metric({
      value: givenAnnualMemberRevenue,
      unit: 'currency',
      formula: 'annualMemberRevenue (provided)',
      inputs: { annualMemberRevenue: givenAnnualMemberRevenue },
    })
  } else if (activeMembers != null && freq != null && aov != null) {
    memberRevenueM = memberRevenue({
      activeMembers,
      purchaseFrequencyPerYear: freq,
      averageOrderValue: aov,
    })
  } else {
    if (activeMembers == null) need('members.active')
    if (freq == null) need('purchaseFrequencyPerYear')
    if (aov == null) need('averageOrderValue')
    memberRevenueM = missingMetric({
      unit: 'currency',
      formula: 'activeMembers × purchaseFrequencyPerYear × averageOrderValue',
      missing: [
        ...(activeMembers == null ? ['members.active'] : []),
        ...(freq == null ? ['purchaseFrequencyPerYear'] : []),
        ...(aov == null ? ['averageOrderValue'] : []),
      ],
    })
  }

  let grossMarginM: Metric
  if (grossMarginPct != null && Number.isFinite(memberRevenueM.value as number)) {
    grossMarginM = grossMargin({
      memberRevenue: memberRevenueM.value as number,
      grossMarginPct,
    })
  } else {
    if (grossMarginPct == null) need('grossMarginPct')
    grossMarginM = missingMetric({
      unit: 'currency',
      formula: 'memberRevenue × grossMarginPct',
      missing: [
        ...(grossMarginPct == null ? ['grossMarginPct'] : []),
        ...(Number.isFinite(memberRevenueM.value as number) ? [] : ['memberRevenue']),
      ],
    })
  }

  let rewardSpendM: Metric
  if (rewardCostPct != null && Number.isFinite(memberRevenueM.value as number)) {
    rewardSpendM = rewardSpend({
      memberRevenue: memberRevenueM.value as number,
      rewardCostPctOfRevenue: rewardCostPct,
    })
  } else {
    if (rewardCostPct == null) need('rewardCostPctOfRevenue')
    rewardSpendM = missingMetric({
      unit: 'currency',
      formula: 'memberRevenue × rewardCostPctOfRevenue',
      missing: [
        ...(rewardCostPct == null ? ['rewardCostPctOfRevenue'] : []),
        ...(Number.isFinite(memberRevenueM.value as number) ? [] : ['memberRevenue']),
      ],
    })
  }

  let activeMembersM: Metric
  if (activeMembers != null) {
    activeMembersM = metric({
      value: activeMembers,
      unit: 'count',
      formula: 'members.active (given)',
      inputs: { activeMembers },
    })
  } else {
    activeMembersM = missingMetric({
      unit: 'count',
      formula: 'members.active (given)',
      missing: ['members.active'],
    })
  }

  const result: EconomicsResult = {
    pointsLiability: liabilityM,
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
