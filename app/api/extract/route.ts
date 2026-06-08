import { NextRequest, NextResponse } from 'next/server'
import { extractDiscoveryFromNotes } from '@/lib/llm/extract'

// Avoid static optimisation — this route reads env vars and calls an external API.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const notes = (body as { notes?: unknown })?.notes
  if (typeof notes !== 'string' || !notes.trim()) {
    return NextResponse.json(
      { error: 'Field "notes" is required and must be non-empty.' },
      { status: 400 },
    )
  }

  try {
    const result = await extractDiscoveryFromNotes(notes)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown extraction error'
    const isConfig = message.includes('ANTHROPIC_API_KEY')
    return NextResponse.json({ error: message }, { status: isConfig ? 503 : 500 })
  }
}
