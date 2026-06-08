'use client'

import { useState } from 'react'
import type { Metric } from '@/lib/types/metric'
import { formatMetric, formatPercentSigned, formatCurrencySigned } from '@/lib/format'
import { isComputed } from '@/lib/calc/util'

type Props = {
  metric: Metric
  currency: string
  signed?: boolean
  compact?: boolean
  /** Optional label rendered above the value (e.g. "Annual uplift"). */
  label?: string
  /** Pick a different size — defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-base font-semibold',
  md: 'text-xl font-semibold',
  lg: 'text-2xl font-semibold',
  xl: 'text-4xl font-semibold tracking-tight',
}

/**
 * Renders a Metric's value with a click affordance to "show the working":
 * formula, inputs, and notes. The popover is non-modal and keyboard-accessible.
 */
export function MetricCell({
  metric,
  currency,
  signed = false,
  compact = false,
  label,
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false)

  let display: string
  if (!isComputed(metric)) {
    display = '—'
  } else if (signed && metric.unit === 'currency') {
    display = formatCurrencySigned(metric.value as number, currency, { compact })
  } else if (signed && metric.unit === 'percent') {
    display = formatPercentSigned(metric.value as number)
  } else {
    display = formatMetric(metric, currency, { compact })
  }

  const computed = isComputed(metric)
  const valueColor = !computed
    ? 'text-slate-400'
    : signed && (metric.value as number) < 0
      ? 'text-rose-700'
      : signed && (metric.value as number) > 0
        ? 'text-emerald-700'
        : 'text-slate-900'

  return (
    <div className="relative inline-block">
      {label ? (
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          {label}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-baseline gap-1 ${SIZE_CLASSES[size]} ${valueColor} hover:text-slate-700`}
        title="Click to show the working"
      >
        <span>{display}</span>
        <span className="text-xs font-normal text-slate-400">ⓘ</span>
      </button>
      {open ? (
        <div
          role="dialog"
          className="absolute z-20 left-0 top-full mt-2 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg text-left"
        >
          <div className="font-mono font-medium text-slate-800 break-words">
            {metric.formula}
          </div>
          {Object.keys(metric.inputs).length > 0 ? (
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-slate-600">
              {Object.entries(metric.inputs).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-slate-500 truncate">{k}</dt>
                  <dd className="font-mono text-slate-800 text-right">
                    {v === undefined
                      ? '—'
                      : typeof v === 'number'
                        ? new Intl.NumberFormat('en-IN').format(
                            Number.isInteger(v) ? v : Number(v.toFixed(4)),
                          )
                        : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {metric.notes ? (
            <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-amber-800">
              {metric.notes}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
