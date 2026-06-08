/**
 * A computed value carrying its inputs and formula so the UI can "show the working".
 * Every number the calc engine returns is wrapped in Metric — no raw numbers leak
 * to display without provenance.
 */
export type Metric<T = number> = {
  value: T
  unit: MetricUnit
  formula: string
  inputs: Record<string, number | string | undefined>
  notes?: string
}

export type MetricUnit =
  | 'currency'
  | 'points'
  | 'percent'
  | 'ratio'
  | 'count'
  | 'months'
  | 'years'

export function metric<T>(args: {
  value: T
  unit: MetricUnit
  formula: string
  inputs: Record<string, number | string | undefined>
  notes?: string
}): Metric<T> {
  return args
}
