'use client'

import { useMemo } from 'react'
import { useStore, useCurrency } from '@/lib/state/store'
import { computeCurrentState } from '@/lib/calc/current-state'
import { computeFutureState } from '@/lib/calc/future-state'
import { ASSUMPTION_LABELS, DEFAULT_ASSUMPTIONS } from '@/lib/types/assumptions'
import type { EconomicsResult } from '@/lib/types/economics'
import { MetricCell } from './MetricCell'
import { NumberField } from './Field'

type Row = {
  label: string
  key: keyof EconomicsResult
  signed?: boolean
  compact?: boolean
}

const ROWS: Row[] = [
  { label: 'Active members', key: 'activeMembers' },
  { label: 'Annual member revenue', key: 'memberRevenue', compact: true },
  { label: 'Gross margin', key: 'grossMargin', compact: true },
  { label: 'Reward spend (annual)', key: 'rewardSpend', compact: true },
  { label: 'Points liability', key: 'pointsLiability', compact: true },
  { label: 'Annual points issued', key: 'annualPointsIssued', compact: true },
  { label: 'Annual points redeemed', key: 'annualPointsRedeemed', compact: true },
  { label: 'Redemption rate', key: 'redemptionRate' },
  { label: 'Breakage rate', key: 'breakageRate' },
  { label: 'Earn / burn ratio', key: 'earnBurnRatio' },
  { label: 'Breakage value (annual)', key: 'breakageValue', compact: true },
  { label: 'Redemption cost (annual)', key: 'redemptionCost', compact: true },
]

export function ReviewView() {
  const { discovery, assumptions, updateAssumption, resetAssumptions, setStep } =
    useStore()
  const currency = useCurrency()

  const { result: current, missing: currentMissing } = useMemo(
    () => computeCurrentState(discovery),
    [discovery],
  )
  const { result: future, missing: futureMissing } = useMemo(
    () => computeFutureState(discovery, assumptions),
    [discovery, assumptions],
  )
  const missing = Array.from(new Set([...currentMissing, ...futureMissing]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Review &amp; model
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Current-state economics derived from discovery. Edit the
            future-state assumptions on the right to model what Capillary
            delivers — every number on this page is traceable to its formula
            and inputs (click any value).
          </p>
        </div>
      </div>

      {missing.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-semibold">
            {missing.length} input{missing.length === 1 ? '' : 's'} missing — these
            metrics fall back to &ldquo;—&rdquo;:
          </div>
          <ul className="mt-1 list-inside list-disc">
            {missing.map((m) => (
              <li key={m}>
                <code className="text-amber-900">{m}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Current state</th>
                <th className="px-4 py-3 font-medium">Future state (Capillary)</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {row.label}
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell
                      metric={current[row.key]}
                      currency={currency}
                      compact={row.compact}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell
                      metric={future[row.key]}
                      currency={currency}
                      compact={row.compact}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Future-state assumptions
            </h3>
            <button
              type="button"
              onClick={resetAssumptions}
              className="text-xs text-indigo-600 hover:underline"
            >
              Reset to defaults
            </button>
          </header>
          <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 mb-4">
            Placeholders — calibrate with Capillary SA / finance before any external
            demo. Defaults are illustrative only.
          </div>
          <div className="flex flex-col gap-3">
            <NumberField
              label={ASSUMPTION_LABELS.redemptionRateUpliftPp}
              value={assumptions.redemptionRateUpliftPp * 100}
              onChange={(v) =>
                updateAssumption(
                  'redemptionRateUpliftPp',
                  v !== undefined ? v / 100 : DEFAULT_ASSUMPTIONS.redemptionRateUpliftPp,
                )
              }
              suffix="pp"
              step="0.5"
            />
            <NumberField
              label={ASSUMPTION_LABELS.retentionUpliftPct}
              value={assumptions.retentionUpliftPct * 100}
              onChange={(v) =>
                updateAssumption(
                  'retentionUpliftPct',
                  v !== undefined ? v / 100 : DEFAULT_ASSUMPTIONS.retentionUpliftPct,
                )
              }
              suffix="%"
              step="0.5"
            />
            <NumberField
              label={ASSUMPTION_LABELS.frequencyUpliftPct}
              value={assumptions.frequencyUpliftPct * 100}
              onChange={(v) =>
                updateAssumption(
                  'frequencyUpliftPct',
                  v !== undefined ? v / 100 : DEFAULT_ASSUMPTIONS.frequencyUpliftPct,
                )
              }
              suffix="%"
              step="0.5"
            />
            <NumberField
              label={ASSUMPTION_LABELS.aovUpliftPct}
              value={assumptions.aovUpliftPct * 100}
              onChange={(v) =>
                updateAssumption(
                  'aovUpliftPct',
                  v !== undefined ? v / 100 : DEFAULT_ASSUMPTIONS.aovUpliftPct,
                )
              }
              suffix="%"
              step="0.5"
            />
            <NumberField
              label={ASSUMPTION_LABELS.rewardCostDeltaPct}
              value={assumptions.rewardCostDeltaPct * 100}
              onChange={(v) =>
                updateAssumption(
                  'rewardCostDeltaPct',
                  v !== undefined ? v / 100 : DEFAULT_ASSUMPTIONS.rewardCostDeltaPct,
                )
              }
              suffix="%"
              step="0.5"
            />
            <NumberField
              label={ASSUMPTION_LABELS.annualPlatformCost}
              value={assumptions.annualPlatformCost}
              onChange={(v) =>
                updateAssumption('annualPlatformCost', v ?? 0)
              }
              step={100000}
              suffix={currency}
            />
            <NumberField
              label={ASSUMPTION_LABELS.oneTimeImplementationCost}
              value={assumptions.oneTimeImplementationCost}
              onChange={(v) =>
                updateAssumption('oneTimeImplementationCost', v ?? 0)
              }
              step={100000}
              suffix={currency}
            />
          </div>
        </aside>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep('discovery')}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Back to discovery
        </button>
        <button
          type="button"
          onClick={() => setStep('business-case')}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Continue to business case →
        </button>
      </div>
    </div>
  )
}
