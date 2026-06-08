import { metric, type Metric, type MetricUnit } from '@/lib/types/metric'

export function annualMultiplier(timeframeMonths: number): number {
  if (timeframeMonths <= 0) {
    throw new Error('timeframeMonths must be > 0')
  }
  return 12 / timeframeMonths
}

/**
 * Placeholder Metric for a value we couldn't compute because required inputs are missing.
 * Renders as "—" or "needs: X" in the UI; never silently shows 0.
 */
export function missingMetric(args: {
  unit: MetricUnit
  formula: string
  missing: string[]
}): Metric {
  return metric({
    value: NaN,
    unit: args.unit,
    formula: args.formula,
    inputs: Object.fromEntries(args.missing.map((m) => [m, undefined])),
    notes: `Cannot compute — missing: ${args.missing.join(', ')}`,
  })
}

export function isComputed(m: Metric): boolean {
  return Number.isFinite(m.value as number)
}
