'use client'

import { useStore } from '@/lib/state/store'
import { Section } from './Section'
import { NumberField, SelectField, TextAreaField, TextField } from './Field'
import { PasteNotesPanel } from './PasteNotesPanel'
import { RequirementsField } from './RequirementsField'
import type { Channel } from '@/lib/types/discovery'

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'app', label: 'Mobile app' },
  { value: 'pos', label: 'POS / store' },
  { value: 'callcenter', label: 'Call centre' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

export function DiscoveryForm() {
  const {
    discovery: d,
    updateDiscovery,
    updateProspect,
    updateProgram,
    updateMembers,
    setStep,
  } = useStore()

  const setChannel = (ch: Channel, on: boolean) => {
    const next = new Set(d.channels ?? [])
    if (on) next.add(ch)
    else next.delete(ch)
    updateDiscovery({ channels: Array.from(next) })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-600">
        Capture the prospect&rsquo;s current loyalty program. Every field is optional;
        anything missing surfaces as &ldquo;needs input&rdquo; on the review and business-case
        screens, so the SA knows what&rsquo;s driving uncertainty. Use{' '}
        <span className="font-medium">Load sample</span> for a worked example, or paste
        raw call notes below to auto-fill.
      </p>

      <PasteNotesPanel />

      <Section title="Prospect" hint="Who the deal is with.">
        <TextField
          label="Prospect name"
          value={d.prospect?.name}
          onChange={(v) => updateProspect({ name: v })}
          placeholder="e.g. Acme Retail"
        />
        <TextField
          label="Industry"
          value={d.prospect?.industry}
          onChange={(v) => updateProspect({ industry: v })}
          placeholder="e.g. Fashion & Apparel"
        />
        <TextField
          label="Region"
          value={d.prospect?.region}
          onChange={(v) => updateProspect({ region: v })}
          placeholder="e.g. India, MENA, SEA"
        />
        <SelectField
          label="Currency"
          value={d.prospect?.currency}
          onChange={(v) => updateProspect({ currency: v })}
          options={[
            { value: 'INR', label: 'INR — Indian rupee' },
            { value: 'USD', label: 'USD — US dollar' },
            { value: 'AED', label: 'AED — UAE dirham' },
            { value: 'GBP', label: 'GBP — Pound sterling' },
            { value: 'EUR', label: 'EUR — Euro' },
          ]}
        />
      </Section>

      <Section title="Current program" hint="What they run today.">
        <TextField
          label="Program name"
          value={d.program?.name}
          onChange={(v) => updateProgram({ name: v })}
          placeholder="e.g. Acme Rewards"
        />
        <TextField
          label="Current vendor"
          value={d.program?.vendor}
          onChange={(v) => updateProgram({ vendor: v })}
          placeholder="e.g. in-house, Annex Cloud, Comarch"
        />
        <NumberField
          label="Launch year"
          value={d.program?.launchYear}
          onChange={(v) => updateProgram({ launchYear: v })}
          placeholder="e.g. 2019"
          step={1}
        />
      </Section>

      <Section title="Members" hint="Membership base shape.">
        <NumberField
          label="Total members"
          value={d.members?.total}
          onChange={(v) => updateMembers({ total: v })}
        />
        <NumberField
          label="Active members"
          value={d.members?.active}
          onChange={(v) => updateMembers({ active: v })}
          hint="Used to derive member revenue."
        />
        <NumberField
          label="Lapsed members"
          value={d.members?.lapsed}
          onChange={(v) => updateMembers({ lapsed: v })}
        />
      </Section>

      <Section
        title="Points economics"
        hint="Issuance, redemption, point value, expiry."
      >
        <NumberField
          label="Period (months)"
          value={d.timeframeMonths}
          onChange={(v) => updateDiscovery({ timeframeMonths: v })}
          placeholder="12"
          hint="The period covered by issued / redeemed below. Annualised for downstream metrics."
          step={1}
          min={1}
        />
        <NumberField
          label="Points issued (period)"
          value={d.pointsIssued}
          onChange={(v) => updateDiscovery({ pointsIssued: v })}
        />
        <NumberField
          label="Points redeemed (period)"
          value={d.pointsRedeemed}
          onChange={(v) => updateDiscovery({ pointsRedeemed: v })}
        />
        <NumberField
          label="Outstanding (unredeemed) points"
          value={d.outstandingPoints}
          onChange={(v) => updateDiscovery({ outstandingPoints: v })}
          hint="Drives the liability headline."
        />
        <NumberField
          label="Point value (local currency / point)"
          value={d.pointValue}
          onChange={(v) => updateDiscovery({ pointValue: v })}
          step="0.01"
          placeholder="e.g. 0.10"
        />
        <NumberField
          label="Point expiry (months)"
          value={d.expiryMonths}
          onChange={(v) => updateDiscovery({ expiryMonths: v })}
          step={1}
        />
      </Section>

      <Section
        title="Revenue & margin"
        hint="Used to model uplift on a Capillary program."
      >
        <NumberField
          label="Average order value"
          value={d.averageOrderValue}
          onChange={(v) => updateDiscovery({ averageOrderValue: v })}
          hint="Per transaction, local currency."
        />
        <NumberField
          label="Purchase frequency / year"
          value={d.purchaseFrequencyPerYear}
          onChange={(v) => updateDiscovery({ purchaseFrequencyPerYear: v })}
          step="0.1"
        />
        <NumberField
          label="Annual member revenue (override)"
          value={d.annualMemberRevenue}
          onChange={(v) => updateDiscovery({ annualMemberRevenue: v })}
          hint="Optional. If set, used instead of activeMembers × freq × AOV."
        />
        <NumberField
          label="Reward cost (% of member revenue)"
          value={
            d.rewardCostPctOfRevenue !== undefined
              ? d.rewardCostPctOfRevenue * 100
              : undefined
          }
          onChange={(v) =>
            updateDiscovery({
              rewardCostPctOfRevenue: v !== undefined ? v / 100 : undefined,
            })
          }
          suffix="%"
          step="0.1"
          min={0}
          max={100}
        />
        <NumberField
          label="Gross margin (% of member revenue)"
          value={d.grossMarginPct !== undefined ? d.grossMarginPct * 100 : undefined}
          onChange={(v) =>
            updateDiscovery({
              grossMarginPct: v !== undefined ? v / 100 : undefined,
            })
          }
          suffix="%"
          step="0.1"
          min={0}
          max={100}
        />
      </Section>

      <Section title="Channels" hint="Where the program runs.">
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const on = (d.channels ?? []).includes(c.value)
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannel(c.value, !on)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  on
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section
        title="Requirements / pain points"
        hint="What the prospect's current program is missing or struggling with — drives which Capillary capabilities are auto-suggested on the next screen."
      >
        <RequirementsField />
      </Section>

      <Section title="Call notes" hint="Free text — useful context for the narrative.">
        <TextAreaField
          label="Notes"
          value={d.notes}
          onChange={(v) => updateDiscovery({ notes: v })}
          placeholder="Anything qualitative worth carrying forward into the business case."
        />
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep('review')}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Continue to review & model →
        </button>
      </div>
    </div>
  )
}
