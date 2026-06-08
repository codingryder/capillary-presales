'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type {
  ImpactLever,
  LeverProvenance,
  Scenario,
} from '@/lib/types/capability'
import { LEVER_CAPS } from '@/lib/types/capability'
import { formatCurrency, formatPercent } from '@/lib/format'

const LEVER_LABEL: Record<ImpactLever, string> = {
  redemptionRateUpliftPp: 'Redemption rate uplift',
  retentionUpliftPct: 'Retention uplift',
  frequencyUpliftPct: 'Frequency uplift',
  aovUpliftPct: 'AOV uplift',
  rewardCostDeltaPct: 'Reward cost change',
}

const POPOVER_WIDTH = 360
const POPOVER_MARGIN = 8

function formatLeverValue(lever: ImpactLever, v: number): string {
  if (lever === 'redemptionRateUpliftPp') return `+${(v * 100).toFixed(1)} pp`
  if (lever === 'rewardCostDeltaPct') {
    if (v === 0) return '0%'
    return `${(v * 100).toFixed(1)}%`
  }
  return `+${(v * 100).toFixed(1)}%`
}

const SCENARIO_LABEL: Record<Scenario, string> = {
  low: 'Low',
  mid: 'Typical',
  high: 'High',
}

export function DerivedLeverRow({
  provenance,
}: {
  provenance: LeverProvenance
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const position = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    let left = rect.left
    if (left + POPOVER_WIDTH > window.innerWidth - POPOVER_MARGIN) {
      left = Math.max(POPOVER_MARGIN, rect.right - POPOVER_WIDTH)
    }
    let top: number = rect.bottom + POPOVER_MARGIN
    const popoverH = popoverRef.current?.offsetHeight ?? 0
    if (popoverH > 0 && top + popoverH > window.innerHeight - POPOVER_MARGIN) {
      top = Math.max(POPOVER_MARGIN, rect.top - POPOVER_MARGIN - popoverH)
    }
    setStyle({
      position: 'fixed',
      top,
      left,
      width: POPOVER_WIDTH,
      zIndex: 50,
    })
  }

  useEffect(() => {
    if (!open) return
    position()
    const raf = requestAnimationFrame(position)
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
    const onReposition = () => position()
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

  const noContribs = provenance.contributors.length === 0
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-slate-500 underline-offset-2 hover:underline"
      >
        {LEVER_LABEL[provenance.lever]}
        <span className="ml-1 text-slate-400">ⓘ</span>
      </button>
      <div className="font-mono text-sm font-semibold text-slate-900">
        {noContribs
          ? <span className="text-slate-300">—</span>
          : formatLeverValue(provenance.lever, provenance.value)}
        {provenance.capped ? (
          <span className="ml-1 text-[10px] font-normal text-amber-700">
            (capped)
          </span>
        ) : null}
      </div>
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          style={style}
          className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg text-left print:hidden"
        >
          <div className="font-medium text-slate-800">
            {LEVER_LABEL[provenance.lever]}
          </div>
          <div className="mt-1 text-slate-500">
            {noContribs ? (
              <>No selected capability drives this lever.</>
            ) : (
              <>
                Sum of {provenance.contributors.length} contributor
                {provenance.contributors.length === 1 ? '' : 's'}
                {provenance.capped ? (
                  <>
                    {' '}— raw sum {formatLeverValue(provenance.lever, provenance.rawSum)},
                    clamped to lever cap{' '}
                    {formatLeverValue(
                      provenance.lever,
                      provenance.lever === 'rewardCostDeltaPct'
                        ? LEVER_CAPS[provenance.lever].min
                        : LEVER_CAPS[provenance.lever].max,
                    )}.
                  </>
                ) : null}
              </>
            )}
          </div>
          {provenance.contributors.length > 0 ? (
            <ul className="mt-2 divide-y divide-slate-100">
              {provenance.contributors.map((c) => (
                <li key={c.capabilityId} className="py-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      {c.capabilityName}
                    </span>
                    <span className="font-mono text-slate-900">
                      {formatLeverValue(provenance.lever, c.contribution)}
                      <span className="ml-1 text-[10px] text-slate-400">
                        ({SCENARIO_LABEL[c.scenario]})
                      </span>
                    </span>
                  </div>
                  <div className="mt-0.5 text-slate-500">{c.rationale}</div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Format a cost lever for display in the assumption summary. */
export function formatCostLever(value: number, currency: string): string {
  return formatCurrency(value, currency, { compact: true })
}

/** Format a generic percent for display (non-signed). */
export function formatLeverPercent(v: number): string {
  return formatPercent(v)
}
