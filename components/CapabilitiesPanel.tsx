'use client'

import { useMemo, useState } from 'react'
import {
  CAPABILITY_CATALOG,
  capabilitiesForRequirement,
} from '@/lib/capabilities/catalog'
import {
  CATEGORY_LABELS,
  type Capability,
  type CapabilityCategory,
  type ImpactLever,
  type Scenario,
} from '@/lib/types/capability'
import { useStore, useCurrency } from '@/lib/state/store'
import { NumberField } from './Field'
import { DerivedLeverRow } from './AssumptionDerivation'

const CATEGORY_ORDER: CapabilityCategory[] = [
  'engagement',
  'mechanics',
  'analytics',
  'channels',
  'operations',
]

const ALL_LEVERS: ImpactLever[] = [
  'redemptionRateUpliftPp',
  'retentionUpliftPct',
  'frequencyUpliftPct',
  'aovUpliftPct',
  'rewardCostDeltaPct',
]

const SCENARIO_LABEL: Record<Scenario, string> = {
  low: 'Low',
  mid: 'Typical',
  high: 'High',
}

export function CapabilitiesPanel() {
  const {
    discovery,
    capabilitySelection,
    toggleCapability,
    setCapabilityScenario,
    setAllCapabilityScenarios,
    clearCapabilities,
    derived,
    annualPlatformCost,
    oneTimeImplementationCost,
    setAnnualPlatformCost,
    setOneTimeImplementationCost,
  } = useStore()
  const currency = useCurrency()

  const requirements = discovery.requirements ?? []
  const suggestedIds = useMemo(() => {
    const set = new Set<string>()
    for (const r of requirements) {
      for (const c of capabilitiesForRequirement(r)) set.add(c.id)
    }
    return set
  }, [requirements])

  const [showAll, setShowAll] = useState(false)

  const grouped: Record<CapabilityCategory, Capability[]> = {
    engagement: [],
    mechanics: [],
    analytics: [],
    channels: [],
    operations: [],
  }
  for (const cap of CAPABILITY_CATALOG) grouped[cap.category].push(cap)

  const selectedCount = Object.keys(capabilitySelection).length

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Capillary capabilities
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Pick which capabilities you&rsquo;d propose for this prospect.
          Auto-suggested entries (marked <span className="text-indigo-600">★</span>)
          address discovery requirements. Each capability&rsquo;s impact on
          assumption levers stacks; per-lever caps prevent unrealistic totals.
          <span className="ml-1 text-amber-700">
            Catalog impacts are v0 placeholders pending SA / finance review.
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              <span className="font-mono text-slate-900">{selectedCount}</span> selected
            </span>
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={clearCapabilities}
                className="text-rose-600 hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-slate-500">Set all to:</span>
            {(['low', 'mid', 'high'] as Scenario[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setAllCapabilityScenarios(s)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {SCENARIO_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">
          Derived assumptions
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Computed from your selection. Click any lever for the contributing
          capabilities and rationale.
        </p>
        <div className="mt-3 divide-y divide-slate-100">
          {ALL_LEVERS.map((lever) => (
            <DerivedLeverRow key={lever} provenance={derived.provenance[lever]} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Commercial inputs</h4>
        <p className="mt-1 text-xs text-slate-500">
          Direct inputs — not derived from capabilities.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <NumberField
            label="Annual Capillary platform cost"
            value={annualPlatformCost}
            onChange={(v) => setAnnualPlatformCost(v ?? 0)}
            step={100000}
            suffix={currency}
          />
          <NumberField
            label="One-time implementation cost"
            value={oneTimeImplementationCost}
            onChange={(v) => setOneTimeImplementationCost(v ?? 0)}
            step={100000}
            suffix={currency}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Catalog</h4>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show all capabilities (not just suggested)
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-4">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat].filter(
              (c) => showAll || suggestedIds.has(c.id) || c.id in capabilitySelection,
            )
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {CATEGORY_LABELS[cat]}
                </div>
                <ul className="mt-2 divide-y divide-slate-100">
                  {items.map((cap) => {
                    const selectedScenario = capabilitySelection[cap.id]
                    const selected = !!selectedScenario
                    const isSuggested = suggestedIds.has(cap.id)
                    return (
                      <li key={cap.id} className="py-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleCapability(cap.id, 'mid')}
                            className="mt-1 rounded border-slate-300"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {cap.name}
                              </span>
                              {isSuggested ? (
                                <span className="text-xs text-indigo-600">★ suggested</span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {cap.description}
                            </div>
                            {selected ? (
                              <div className="mt-2 flex items-center gap-1">
                                {(['low', 'mid', 'high'] as Scenario[]).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setCapabilityScenario(cap.id, s)}
                                    className={`rounded-md border px-2 py-0.5 text-xs transition ${
                                      selectedScenario === s
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {SCENARIO_LABEL[s]}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
          {!showAll &&
          requirements.length === 0 &&
          Object.keys(capabilitySelection).length === 0 ? (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              No discovery requirements were flagged, so nothing is auto-suggested.
              Enable &ldquo;Show all capabilities&rdquo; above to browse the catalog.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
