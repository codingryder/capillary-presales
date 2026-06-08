'use client'

import { useStore, type WizardStep } from '@/lib/state/store'

const STEPS: { key: WizardStep; label: string; index: number }[] = [
  { key: 'discovery', label: 'Discovery', index: 1 },
  { key: 'review', label: 'Review & model', index: 2 },
  { key: 'business-case', label: 'Business case', index: 3 },
]

export function StepNav() {
  const { step, setStep } = useStore()
  const currentIndex = STEPS.find((s) => s.key === step)?.index ?? 1

  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const isCurrent = s.key === step
        const isDone = s.index < currentIndex
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDone
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent
                    ? 'bg-white text-indigo-600'
                    : isDone
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-300 text-white'
                }`}
              >
                {s.index}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 ? (
              <span className="text-slate-300">›</span>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
