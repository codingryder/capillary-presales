import { NextRequest, NextResponse } from 'next/server'
import { generateNarrative } from '@/lib/llm/narrative'
import type { CapabilitySelection } from '@/lib/types/capability'
import type { DiscoveryInput } from '@/lib/types/discovery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    discovery,
    capabilitySelection,
    annualPlatformCost,
    oneTimeImplementationCost,
  } = (body ?? {}) as {
    discovery?: DiscoveryInput
    capabilitySelection?: CapabilitySelection
    annualPlatformCost?: number
    oneTimeImplementationCost?: number
  }

  if (!discovery || typeof discovery !== 'object') {
    return NextResponse.json(
      { error: 'Field "discovery" is required.' },
      { status: 400 },
    )
  }
  if (!capabilitySelection || typeof capabilitySelection !== 'object') {
    return NextResponse.json(
      { error: 'Field "capabilitySelection" is required (may be empty object).' },
      { status: 400 },
    )
  }

  try {
    const result = await generateNarrative({
      discovery,
      capabilitySelection,
      annualPlatformCost: Number(annualPlatformCost ?? 0),
      oneTimeImplementationCost: Number(oneTimeImplementationCost ?? 0),
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown narrative error'
    const isConfig = message.includes('GEMINI_API_KEY')
    return NextResponse.json({ error: message }, { status: isConfig ? 503 : 500 })
  }
}
