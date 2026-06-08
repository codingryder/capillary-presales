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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 font-semibold text-white shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-semibold text-slate-900">Capillary</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">Presales solutioning</span>
              </div>
              <div className="text-xs text-slate-400">
                {prospectName
                  ? `${prospectName} · loyalty business case`
                  : 'New loyalty business case'}
              </div>
            </div>
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

      <footer className="mx-auto mt-12 max-w-6xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6 print:hidden">
        Capillary Technologies · Internal presales POC. Numbers are deterministic
        from the captured discovery; defaults pending SA / finance calibration.
      </footer>
    </div>
  )
}
