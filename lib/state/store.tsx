'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Assumptions } from '@/lib/types/assumptions'
import type { DiscoveryInput, ProgramMeta, ProspectMeta, MembersShape } from '@/lib/types/discovery'
import {
  EMPTY_ASSUMPTIONS,
  EMPTY_DISCOVERY,
  SAMPLE_ASSUMPTIONS,
  SAMPLE_DISCOVERY,
} from '@/lib/sample'

export type WizardStep = 'discovery' | 'review' | 'business-case'

type StoreValue = {
  step: WizardStep
  setStep: (s: WizardStep) => void

  discovery: DiscoveryInput
  setDiscovery: (next: DiscoveryInput) => void
  updateDiscovery: (patch: Partial<DiscoveryInput>) => void
  updateProspect: (patch: Partial<ProspectMeta>) => void
  updateProgram: (patch: Partial<ProgramMeta>) => void
  updateMembers: (patch: Partial<MembersShape>) => void

  assumptions: Assumptions
  setAssumptions: (next: Assumptions) => void
  updateAssumption: <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => void

  loadSample: () => void
  resetAssumptions: () => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<WizardStep>('discovery')
  const [discovery, setDiscovery] = useState<DiscoveryInput>(EMPTY_DISCOVERY)
  const [assumptions, setAssumptions] = useState<Assumptions>(EMPTY_ASSUMPTIONS)

  const updateDiscovery = useCallback((patch: Partial<DiscoveryInput>) => {
    setDiscovery((d) => ({ ...d, ...patch }))
  }, [])

  const updateProspect = useCallback((patch: Partial<ProspectMeta>) => {
    setDiscovery((d) => ({
      ...d,
      prospect: { ...(d.prospect ?? {}), ...patch },
    }))
  }, [])

  const updateProgram = useCallback((patch: Partial<ProgramMeta>) => {
    setDiscovery((d) => ({
      ...d,
      program: { ...(d.program ?? {}), ...patch },
    }))
  }, [])

  const updateMembers = useCallback((patch: Partial<MembersShape>) => {
    setDiscovery((d) => ({
      ...d,
      members: { ...(d.members ?? {}), ...patch },
    }))
  }, [])

  const updateAssumption = useCallback(
    <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
      setAssumptions((a) => ({ ...a, [key]: value }))
    },
    [],
  )

  const loadSample = useCallback(() => {
    setDiscovery(SAMPLE_DISCOVERY)
    setAssumptions(SAMPLE_ASSUMPTIONS)
    setStep('discovery')
  }, [])

  const resetAssumptions = useCallback(() => {
    setAssumptions(EMPTY_ASSUMPTIONS)
  }, [])

  const resetAll = useCallback(() => {
    setDiscovery(EMPTY_DISCOVERY)
    setAssumptions(EMPTY_ASSUMPTIONS)
    setStep('discovery')
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      step,
      setStep,
      discovery,
      setDiscovery,
      updateDiscovery,
      updateProspect,
      updateProgram,
      updateMembers,
      assumptions,
      setAssumptions,
      updateAssumption,
      loadSample,
      resetAssumptions,
      resetAll,
    }),
    [
      step,
      discovery,
      assumptions,
      updateDiscovery,
      updateProspect,
      updateProgram,
      updateMembers,
      updateAssumption,
      loadSample,
      resetAssumptions,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export function useCurrency(): string {
  const { discovery } = useStore()
  return discovery.prospect?.currency ?? 'INR'
}
