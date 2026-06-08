'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

const POPOVER_WIDTH = 320
const POPOVER_MARGIN = 8

/**
 * Renders a Metric's value with a click affordance to "show the working":
 * formula, inputs, and notes.
 *
 * The popover uses `position: fixed` with viewport-aware coords so it escapes
 * ancestor `overflow: hidden` (we have it on the review/business-case tables to
 * round corners) and flips horizontally when there isn't room to the right of
 * the trigger.
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
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const positionPopover = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    let left = rect.left
    if (left + POPOVER_WIDTH > viewportW - POPOVER_MARGIN) {
      left = Math.max(POPOVER_MARGIN, rect.right - POPOVER_WIDTH)
    }

    let top: number = rect.bottom + POPOVER_MARGIN
    const popoverEl = popoverRef.current
    const popoverH = popoverEl?.offsetHeight ?? 0
    if (popoverH > 0 && top + popoverH > viewportH - POPOVER_MARGIN) {
      // Flip above if it would otherwise spill off the bottom.
      top = Math.max(POPOVER_MARGIN, rect.top - POPOVER_MARGIN - popoverH)
    }

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      width: POPOVER_WIDTH,
      zIndex: 50,
    })
  }

  useEffect(() => {
    if (!open) return
    positionPopover()
    // Re-position after the popover renders and has a real offsetHeight, so
    // the vertical-flip branch above sees the actual height.
    const raf = requestAnimationFrame(positionPopover)

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        triggerRef.current?.contains(t) ||
        popoverRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    const onReposition = () => positionPopover()

    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

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
    <div className="inline-block">
      {label ? (
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          {label}
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-baseline gap-1 ${SIZE_CLASSES[size]} ${valueColor} hover:text-slate-700`}
        title="Click to show the working"
        aria-expanded={open}
      >
        <span>{display}</span>
        <span className="text-xs font-normal text-slate-400">ⓘ</span>
      </button>
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          style={popoverStyle}
          className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg text-left print:hidden"
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
