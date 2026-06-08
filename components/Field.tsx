'use client'

import type { InputHTMLAttributes } from 'react'

type CommonProps = {
  label: string
  hint?: string
  suffix?: string
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  ...rest
}: CommonProps & {
  value: string | undefined
  onChange: (next: string | undefined) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        {...rest}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export function NumberField({
  label,
  hint,
  suffix,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
}: CommonProps & {
  value: number | undefined
  onChange: (next: number | undefined) => void
  placeholder?: string
  step?: number | string
  min?: number
  max?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value === undefined || Number.isNaN(value) ? '' : value}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') {
              onChange(undefined)
              return
            }
            const parsed = Number(raw)
            onChange(Number.isFinite(parsed) ? parsed : undefined)
          }}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {suffix ? (
          <span className="absolute right-3 text-xs text-slate-400">{suffix}</span>
        ) : null}
      </div>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export function SelectField<V extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: CommonProps & {
  value: V | undefined
  onChange: (next: V | undefined) => void
  options: { value: V; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? undefined : (e.target.value as V))
        }
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: CommonProps & {
  value: string | undefined
  onChange: (next: string | undefined) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className="flex flex-col gap-1 sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value ?? ''}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) =>
          onChange(e.target.value === '' ? undefined : e.target.value)
        }
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}
