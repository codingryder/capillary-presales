'use client'

import { useStore } from '@/lib/state/store'
import {
  ALL_REQUIREMENTS,
  REQUIREMENT_LABELS,
  type RequirementCategory,
} from '@/lib/types/requirements'

export function RequirementsField() {
  const { discovery, updateDiscovery } = useStore()
  const selected = new Set(discovery.requirements ?? [])

  const toggle = (r: RequirementCategory) => {
    const next = new Set(selected)
    if (next.has(r)) next.delete(r)
    else next.add(r)
    updateDiscovery({ requirements: Array.from(next) })
  }

  return (
    <div className="sm:col-span-2 flex flex-wrap gap-2">
      {ALL_REQUIREMENTS.map((r) => {
        const on = selected.has(r)
        return (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              on
                ? 'border-amber-500 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {REQUIREMENT_LABELS[r]}
          </button>
        )
      })}
    </div>
  )
}
