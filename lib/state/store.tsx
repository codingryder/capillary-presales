'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  CapabilitySelection,
  DerivedAssumptions,
  Scenario,
} from '@/lib/types/capability'
import type {
  DiscoveryInput,
  ProgramMeta,
  ProspectMeta,
  MembersShape,
} from '@/lib/types/discovery'
import { deriveAssumptions } from '@/lib/capabilities/derive'
import {
  EMPTY_CAPABILITY_SELECTION,
  EMPTY_DISCOVERY,
  SAMPLE_CAPABILITY_SELECTION,
  SAMPLE_DISCOVERY,
  SAMPLE_IMPL_COST,
  SAMPLE_PLATFORM_COST,
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

  /** Selection of Capillary capabilities and their per-capability scenarios. */
  capabilitySelection: CapabilitySelection
  toggleCapability: (capId: string, scenario?: Scenario) => void
  setCapabilityScenario: (capId: string, scenario: Scenario) => void
  setAllCapabilityScenarios: (scenario: Scenario) => void
  clearCapabilities: () => void

  /** Commercial inputs — direct, not derived from capabilities. */
  annualPlatformCost: number
  oneTimeImplementationCost: number
  setAnnualPlatformCost: (value: number) => void
  setOneTimeImplementationCost: (value: number) => void

  /** Derived from capabilitySelection + costs. Read-only output the UI consumes. */
  derived: DerivedAssumptions

  loadSample: () => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<WizardStep>('discovery')
  const [discovery, setDiscovery] = useState<DiscoveryInput>(EMPTY_DISCOVERY)
  const [capabilitySelection, setCapabilitySelection] =
    useState<CapabilitySelection>(EMPTY_CAPABILITY_SELECTION)
  const [annualPlatformCost, setAnnualPlatformCost] = useState<number>(0)
  const [oneTimeImplementationCost, setOneTimeImplementationCost] =
    useState<number>(0)

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

  const toggleCapability = useCallback(
    (capId: string, scenario: Scenario = 'mid') => {
      setCapabilitySelection((sel) => {
        const next = { ...sel }
        if (capId in next) {
          delete next[capId]
        } else {
          next[capId] = scenario
        }
        return next
      })
    },
    [],
  )

  const setCapabilityScenario = useCallback(
    (capId: string, scenario: Scenario) => {
      setCapabilitySelection((sel) => ({ ...sel, [capId]: scenario }))
    },
    [],
  )

  const setAllCapabilityScenarios = useCallback((scenario: Scenario) => {
    setCapabilitySelection((sel) => {
      const next: CapabilitySelection = {}
      for (const k of Object.keys(sel)) next[k] = scenario
      return next
    })
  }, [])

  const clearCapabilities = useCallback(() => {
    setCapabilitySelection({})
  }, [])

  const derived = useMemo(
    () =>
      deriveAssumptions({
        selection: capabilitySelection,
        annualPlatformCost,
        oneTimeImplementationCost,
      }),
    [capabilitySelection, annualPlatformCost, oneTimeImplementationCost],
  )

  const loadSample = useCallback(() => {
    setDiscovery(SAMPLE_DISCOVERY)
    setCapabilitySelection(SAMPLE_CAPABILITY_SELECTION)
    setAnnualPlatformCost(SAMPLE_PLATFORM_COST)
    setOneTimeImplementationCost(SAMPLE_IMPL_COST)
    setStep('discovery')
  }, [])

  const resetAll = useCallback(() => {
    setDiscovery(EMPTY_DISCOVERY)
    setCapabilitySelection(EMPTY_CAPABILITY_SELECTION)
    setAnnualPlatformCost(0)
    setOneTimeImplementationCost(0)
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
      capabilitySelection,
      toggleCapability,
      setCapabilityScenario,
      setAllCapabilityScenarios,
      clearCapabilities,
      annualPlatformCost,
      oneTimeImplementationCost,
      setAnnualPlatformCost,
      setOneTimeImplementationCost,
      derived,
      loadSample,
      resetAll,
    }),
    [
      step,
      discovery,
      capabilitySelection,
      annualPlatformCost,
      oneTimeImplementationCost,
      derived,
      updateDiscovery,
      updateProspect,
      updateProgram,
      updateMembers,
      toggleCapability,
      setCapabilityScenario,
      setAllCapabilityScenarios,
      clearCapabilities,
      loadSample,
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
