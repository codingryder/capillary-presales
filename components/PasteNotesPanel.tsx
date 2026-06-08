'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import type { DiscoveryInput } from '@/lib/types/discovery'

const PLACEHOLDER = `Paste raw call notes or a transcript here. Example:

"Acme Retail runs an in-house loyalty program launched in 2019. They have ~250k members, of which ~100k are active. Over the last 6 months they issued 50M points and redeemed 20M; about 30M points are outstanding on the books. 1 point = ₹0.10. Average order value is ~₹500, members shop about 4 times a year. Reward cost is around 5% of revenue, gross margin about 30%. They're frustrated with weak app engagement and no personalised earn rules."`

type Extracted = {
  discovery: Partial<DiscoveryInput>
  extractedFields: string[]
  model: string
}

export function PasteNotesPanel() {
  const { discovery, setDiscovery } = useStore()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastExtracted, setLastExtracted] = useState<Extracted | null>(null)

  const onExtract = async () => {
    setLoading(true)
    setError(null)
    setLastExtracted(null)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `Request failed (${res.status}).`)
      }
      const data = (await res.json()) as Extracted

      const extracted = data.discovery
      const merged: DiscoveryInput = {
        ...discovery,
        ...extracted,
        prospect: { ...(discovery.prospect ?? {}), ...(extracted.prospect ?? {}) },
        program: { ...(discovery.program ?? {}), ...(extracted.program ?? {}) },
        members: { ...(discovery.members ?? {}), ...(extracted.members ?? {}) },
      }
      setDiscovery(merged)
      setLastExtracted(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Paste notes &amp; auto-fill
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Optional. Paste raw discovery notes or a transcript; the model extracts what&rsquo;s
          stated into the form below. <span className="font-medium">No numbers are
          invented or computed</span> — every figure must be present in the text. Review
          the populated fields before moving on.
        </p>
      </header>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={8}
        placeholder={PLACEHOLDER}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExtract}
          disabled={loading || !notes.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Extracting…' : 'Extract fields →'}
        </button>
        {notes.trim() && !loading ? (
          <button
            type="button"
            onClick={() => {
              setNotes('')
              setError(null)
              setLastExtracted(null)
            }}
            className="text-xs text-slate-500 hover:underline"
          >
            Clear
          </button>
        ) : null}
        {error ? (
          <span className="text-sm text-rose-700">⚠ {error}</span>
        ) : null}
      </div>
      {lastExtracted ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <div className="font-medium">
            Extracted {lastExtracted.extractedFields.length} field
            {lastExtracted.extractedFields.length === 1 ? '' : 's'} via{' '}
            <code className="text-emerald-800">{lastExtracted.model}</code>.
            Review them below before continuing.
          </div>
          <div className="mt-1 text-xs text-emerald-800">
            {lastExtracted.extractedFields.map((f) => (
              <code key={f} className="mr-2 rounded bg-emerald-100 px-1.5 py-0.5">
                {f}
              </code>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
