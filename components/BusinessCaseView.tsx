'use client'

import { useMemo, useState } from 'react'
import { useStore, useCurrency } from '@/lib/state/store'
import { buildBusinessCase } from '@/lib/calc/business-case'
import { ASSUMPTION_LABELS } from '@/lib/types/assumptions'
import { CAPABILITY_BY_ID } from '@/lib/capabilities/catalog'
import type { Capability, Scenario } from '@/lib/types/capability'
import { MetricCell } from './MetricCell'
import { formatCurrency, formatPercent } from '@/lib/format'

const SCENARIO_LABEL: Record<Scenario, string> = {
  low: 'Low',
  mid: 'Typical',
  high: 'High',
}

export function BusinessCaseView() {
  const {
    discovery,
    derived,
    capabilitySelection,
    annualPlatformCost,
    oneTimeImplementationCost,
    setStep,
  } = useStore()
  const currency = useCurrency()
  const assumptions = derived.assumptions

  const bc = useMemo(
    () => buildBusinessCase(discovery, assumptions, derived),
    [discovery, assumptions, derived],
  )

  const selectedCaps = useMemo<{ cap: Capability; scenario: Scenario }[]>(() => {
    const out: { cap: Capability; scenario: Scenario }[] = []
    for (const [id, scenario] of Object.entries(capabilitySelection)) {
      const cap = CAPABILITY_BY_ID[id]
      if (cap) out.push({ cap, scenario })
    }
    return out
  }, [capabilitySelection])

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
        body: JSON.stringify({
          discovery,
          capabilitySelection,
          annualPlatformCost,
          oneTimeImplementationCost,
        }),
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

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:shadow-none print:border-0">
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-700 px-8 py-8 text-white print:bg-none print:bg-white print:text-slate-900 print:border-b print:border-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-100 print:text-indigo-700">
            Loyalty business case · prepared for
          </div>
          <h3 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            {prospectName}
          </h3>
          {discovery.prospect?.industry || discovery.prospect?.region ? (
            <div className="mt-1 text-sm text-indigo-100 print:text-slate-500">
              {[discovery.prospect?.industry, discovery.prospect?.region]
                .filter(Boolean)
                .join(' · ')}
            </div>
          ) : null}
          <div className="mt-3 text-xs text-indigo-200 print:text-slate-400">
            Capillary Technologies · Internal draft for SA review
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <PrimaryHeadlineCard
              label="Annual incremental margin"
              metric={bc.headline.annualUplift}
              currency={currency}
            />
          </div>
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

      {selectedCaps.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none print:border-0">
          <header className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Capillary capabilities modelled
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This case assumes the prospect adopts the following capabilities.
              Assumption levers on the next section are derived from their
              calibrated impact ranges (placeholder ranges pending SA / finance
              review).
            </p>
          </header>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedCaps.map(({ cap, scenario }) => (
              <li
                key={cap.id}
                className="flex items-baseline justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{cap.name}</span>
                <span className="text-xs text-slate-500">
                  {SCENARIO_LABEL[scenario]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
      <MetricCell metric={metric} currency={currency} label={label} size="lg" compact />
    </div>
  )
}

function PrimaryHeadlineCard({
  label,
  metric,
  currency,
}: {
  label: string
  metric: import('@/lib/types/metric').Metric
  currency: string
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm">
      <div className="absolute right-0 top-0 h-full w-1.5 bg-indigo-600"></div>
      <MetricCell metric={metric} currency={currency} label={label} size="xl" compact />
      <p className="mt-3 text-xs text-slate-500">
        Annual run-rate uplift: Δ gross margin minus Δ program cost (reward +
        redemption + Capillary platform).
      </p>
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
