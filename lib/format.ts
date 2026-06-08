import type { Metric, MetricUnit } from './types/metric'

function localeForCurrency(currency: string): string {
  switch (currency) {
    case 'INR':
      return 'en-IN'
    case 'GBP':
      return 'en-GB'
    case 'AED':
      return 'en-AE'
    case 'EUR':
      return 'en-IE'
    default:
      return 'en-US'
  }
}

export function formatCurrency(
  value: number,
  currency: string = 'INR',
  opts: { compact?: boolean } = {},
): string {
  if (!Number.isFinite(value)) return '—'
  const locale = localeForCurrency(currency)
  if (opts.compact && Math.abs(value) >= 100_000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value)
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

/** Signed percent for deltas, e.g. +10.0% / −2.5%. */
export function formatPercentSigned(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${(Math.abs(value) * 100).toFixed(digits)}%`
}

export function formatRatio(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}×`
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(Math.round(value))
}

export function formatMonths(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(1)} months`
}

export function formatPoints(value: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(value)) return '—'
  if (opts.compact && Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value)} pts`
  }
  return `${new Intl.NumberFormat('en-IN').format(Math.round(value))} pts`
}

/**
 * Format a Metric for display using its unit metadata. Currency-typed metrics
 * pick up the prospect's local currency.
 */
export function formatMetric(
  m: Metric,
  currency: string = 'INR',
  opts: { compact?: boolean; signed?: boolean } = {},
): string {
  const value = m.value as number
  switch (m.unit as MetricUnit) {
    case 'currency':
      return formatCurrency(value, currency, { compact: opts.compact })
    case 'percent':
      return opts.signed ? formatPercentSigned(value) : formatPercent(value)
    case 'ratio':
      return formatRatio(value)
    case 'months':
      return formatMonths(value)
    case 'points':
      return formatPoints(value, { compact: opts.compact })
    case 'count':
    default:
      return formatNumber(value)
  }
}

/**
 * Sign-prefixed currency for deltas, e.g. "+₹5,99,250" / "−₹2,98,000".
 */
export function formatCurrencySigned(
  value: number,
  currency: string = 'INR',
  opts: { compact?: boolean } = {},
): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return formatCurrency(0, currency, opts)
  const sign = value > 0 ? '+' : '−'
  return `${sign}${formatCurrency(Math.abs(value), currency, opts)}`
}
