'use client'

import { useStore } from '@/lib/state/store'
import { StepNav } from './StepNav'
import { DiscoveryForm } from './DiscoveryForm'
import { ReviewView } from './ReviewView'
import { BusinessCaseView } from './BusinessCaseView'

export function Wizard() {
  const { step, discovery, loadSample, resetAll } = useStore()
  const prospectName = discovery.prospect?.name?.trim()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Capillary · Presales solutioning
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              {prospectName ? `${prospectName} · loyalty business case` : 'New loyalty business case'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSample}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Load sample
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <StepNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {step === 'discovery' ? <DiscoveryForm /> : null}
        {step === 'review' ? <ReviewView /> : null}
        {step === 'business-case' ? <BusinessCaseView /> : null}
      </main>
    </div>
  )
}
