'use client'

import { useMemo, useState } from 'react'
import { useStore, useCurrency } from '@/lib/state/store'
import { buildBusinessCase } from '@/lib/calc/business-case'
import { ASSUMPTION_LABELS } from '@/lib/types/assumptions'
import { MetricCell } from './MetricCell'
import { formatCurrency, formatPercent } from '@/lib/format'

export function BusinessCaseView() {
  const { discovery, assumptions, setStep } = useStore()
  const currency = useCurrency()

  const bc = useMemo(
    () => buildBusinessCase(discovery, assumptions),
    [discovery, assumptions],
  )

  const prospectName = discovery.prospect?.name?.trim() || 'Prospect'

  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeModel, setNarrativeModel] = useState<string | null>(null)
  const [loadingNarrative, setLoadingNarrative] = useState(false)
  const [narrativeError, setNarrativeError] = useState<string | null>(null)

  const onGenerateNarrative = async () => {
    setLoadingNarrative(true)
    setNarrativeError(null)
    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discovery, assumptions }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `Request failed (${res.status}).`)
      }
      const data = (await res.json()) as { narrative: string; model: string }
      setNarrative(data.narrative)
      setNarrativeModel(data.model)
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setLoadingNarrative(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Business case</h2>
          <p className="mt-1 text-sm text-slate-600">
            Presentation-grade view. Numbers are deterministic from the inputs
            and assumptions on the previous screen. Click any value to see the
            working.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep('review')}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Edit assumptions
          </button>
          <button
            type="button"
            onClick={onGenerateNarrative}
            disabled={loadingNarrative}
            className="rounded-md border border-indigo-600 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingNarrative
              ? 'Writing…'
              : narrative
                ? 'Regenerate summary'
                : 'Generate executive summary'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Print / export PDF
          </button>
        </div>
      </header>

      {narrativeError ? (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-800 print:hidden">
          ⚠ {narrativeError}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-0">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Loyalty business case · prepared for
          </div>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">
            {prospectName}
          </h3>
          {discovery.prospect?.industry || discovery.prospect?.region ? (
            <div className="mt-1 text-sm text-slate-500">
              {[discovery.prospect?.industry, discovery.prospect?.region]
                .filter(Boolean)
                .join(' · ')}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <HeadlineCard
            label="Annual incremental margin"
            metric={bc.headline.annualUplift}
            currency={currency}
            tone="positive"
          />
          <HeadlineCard
            label="3-year net value"
            metric={bc.headline.threeYearNetValue}
            currency={currency}
            tone="positive"
          />
          {bc.headline.paybackMonths ? (
            <HeadlineCard
              label="Payback period"
              metric={bc.headline.paybackMonths}
              currency={currency}
              tone="neutral"
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Payback period
              </div>
              <div className="mt-2 text-xl font-medium text-slate-400">—</div>
              <div className="mt-1 text-xs text-slate-500">
                Requires a positive annual uplift and a one-time implementation cost.
              </div>
            </div>
          )}
        </div>
      </section>

      {narrative ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-0">
          <header className="mb-3 flex items-center justify-between print:hidden">
            <h3 className="text-base font-semibold text-slate-900">
              Executive summary
            </h3>
            {narrativeModel ? (
              <span className="text-xs text-slate-400">
                drafted by <code>{narrativeModel}</code>
              </span>
            ) : null}
          </header>
          <h3 className="hidden print:block text-base font-semibold text-slate-900 mb-3">
            Executive summary
          </h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {narrative}
          </div>
          <p className="mt-3 text-xs text-slate-400 print:hidden">
            Numbers in this summary are pulled verbatim from the deterministic
            calc engine — the model is forbidden from altering or inventing
            figures.
          </p>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Current vs future-state economics
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Side-by-side, with the modelled delta. Click any cell for the formula
            and inputs.
          </p>
        </header>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3 font-medium">Metric</th>
              <th className="px-6 py-3 font-medium">Current</th>
              <th className="px-6 py-3 font-medium">Future</th>
              <th className="px-6 py-3 font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            <Row
              label="Member revenue"
              current={
                <MetricCell
                  metric={bc.current.memberRevenue}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              future={
                <MetricCell
                  metric={bc.future.memberRevenue}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              delta={
                <MetricCell
                  metric={bc.delta.memberRevenue}
                  currency={currency}
                  compact
                  signed
                  size="sm"
                />
              }
            />
            <Row
              label="Gross margin"
              current={
                <MetricCell
                  metric={bc.current.grossMargin}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              future={
                <MetricCell
                  metric={bc.future.grossMargin}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              delta={
                <MetricCell
                  metric={bc.delta.grossMargin}
                  currency={currency}
                  compact
                  signed
                  size="sm"
                />
              }
            />
            <Row
              label="Redemption rate"
              current={
                <MetricCell
                  metric={bc.current.redemptionRate}
                  currency={currency}
                  size="sm"
                />
              }
              future={
                <MetricCell
                  metric={bc.future.redemptionRate}
                  currency={currency}
                  size="sm"
                />
              }
              delta={
                <MetricCell
                  metric={bc.delta.redemptionRate}
                  currency={currency}
                  signed
                  size="sm"
                />
              }
            />
            <Row
              label="Breakage value"
              current={
                <MetricCell
                  metric={bc.current.breakageValue}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              future={
                <MetricCell
                  metric={bc.future.breakageValue}
                  currency={currency}
                  compact
                  size="sm"
                />
              }
              delta={
                <MetricCell
                  metric={bc.delta.breakageValue}
                  currency={currency}
                  compact
                  signed
                  size="sm"
                />
              }
            />
            <Row
              label="Δ program cost (reward + redemption + platform)"
              current={<span className="text-slate-400">—</span>}
              future={<span className="text-slate-400">—</span>}
              delta={
                <MetricCell
                  metric={bc.delta.programCost}
                  currency={currency}
                  compact
                  signed
                  size="sm"
                />
              }
            />
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Assumptions used
        </h3>
        <p className="mt-1 text-xs text-amber-700">
          Placeholders — calibrate with Capillary SA / finance before any
          external demo.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <AssumptionRow
            label={ASSUMPTION_LABELS.redemptionRateUpliftPp}
            value={`+${(assumptions.redemptionRateUpliftPp * 100).toFixed(1)} pp`}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.retentionUpliftPct}
            value={formatPercent(assumptions.retentionUpliftPct)}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.frequencyUpliftPct}
            value={formatPercent(assumptions.frequencyUpliftPct)}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.aovUpliftPct}
            value={formatPercent(assumptions.aovUpliftPct)}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.rewardCostDeltaPct}
            value={formatPercent(assumptions.rewardCostDeltaPct)}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.annualPlatformCost}
            value={formatCurrency(assumptions.annualPlatformCost, currency, {
              compact: true,
            })}
          />
          <AssumptionRow
            label={ASSUMPTION_LABELS.oneTimeImplementationCost}
            value={formatCurrency(
              assumptions.oneTimeImplementationCost,
              currency,
              { compact: true },
            )}
          />
        </dl>
      </section>

      {bc.missingInputs.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-semibold">
            Caveat — uncertainty drivers
          </div>
          <p className="mt-1">
            The following inputs were not captured during discovery. Metrics that
            depend on them show &ldquo;—&rdquo; above; figures should be treated as
            indicative until these are confirmed.
          </p>
          <ul className="mt-2 list-inside list-disc text-amber-900">
            {bc.missingInputs.map((m) => (
              <li key={m}>
                <code>{m}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function HeadlineCard({
  label,
  metric,
  currency,
  tone,
}: {
  label: string
  metric: import('@/lib/types/metric').Metric
  currency: string
  tone: 'positive' | 'neutral'
}) {
  const accent =
    tone === 'positive'
      ? 'border-emerald-300 bg-emerald-50'
      : 'border-slate-200 bg-slate-50'
  return (
    <div className={`rounded-lg border ${accent} p-5`}>
      <MetricCell metric={metric} currency={currency} label={label} size="xl" compact />
    </div>
  )
}

function Row({
  label,
  current,
  future,
  delta,
}: {
  label: string
  current: React.ReactNode
  future: React.ReactNode
  delta: React.ReactNode
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-6 py-4 font-medium text-slate-700">{label}</td>
      <td className="px-6 py-4">{current}</td>
      <td className="px-6 py-4">{future}</td>
      <td className="px-6 py-4">{delta}</td>
    </tr>
  )
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-mono text-slate-900">{value}</dd>
    </div>
  )
}
