import { NextRequest, NextResponse } from 'next/server'
import { generateNarrative } from '@/lib/llm/narrative'
import type { Assumptions } from '@/lib/types/assumptions'
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

  const { discovery, assumptions } = (body ?? {}) as {
    discovery?: DiscoveryInput
    assumptions?: Assumptions
  }

  if (!discovery || typeof discovery !== 'object') {
    return NextResponse.json(
      { error: 'Field "discovery" is required.' },
      { status: 400 },
    )
  }
  if (!assumptions || typeof assumptions !== 'object') {
    return NextResponse.json(
      { error: 'Field "assumptions" is required.' },
      { status: 400 },
    )
  }

  try {
    const result = await generateNarrative(discovery, assumptions)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown narrative error'
    const isConfig = message.includes('ANTHROPIC_API_KEY')
    return NextResponse.json({ error: message }, { status: isConfig ? 503 : 500 })
  }
}
