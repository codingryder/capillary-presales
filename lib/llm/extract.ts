import Anthropic from '@anthropic-ai/sdk'
import type { DiscoveryInput } from '@/lib/types/discovery'
import { DISCOVERY_TOOL, EXTRACTION_SYSTEM_PROMPT } from './schema'

export type ExtractResult = {
  discovery: Partial<DiscoveryInput>
  extractedFields: string[]
  model: string
}

const DEFAULT_MODEL = 'claude-sonnet-4-6'

function flattenFilledKeys(
  obj: Record<string, unknown>,
  prefix = '',
): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length > 0) out.push(prefix + k)
      continue
    }
    if (typeof v === 'object') {
      out.push(...flattenFilledKeys(v as Record<string, unknown>, `${prefix}${k}.`))
      continue
    }
    out.push(prefix + k)
  }
  return out
}

/**
 * Strip empty objects, undefined / null fields, and empty arrays — so downstream
 * shallow-merge logic doesn't overwrite existing values with empty ones.
 */
function clean(input: Partial<DiscoveryInput>): Partial<DiscoveryInput> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      out[k] = v
      continue
    }
    if (typeof v === 'object') {
      const inner: Record<string, unknown> = {}
      for (const [kk, vv] of Object.entries(v as Record<string, unknown>)) {
        if (vv === undefined || vv === null || vv === '') continue
        inner[kk] = vv
      }
      if (Object.keys(inner).length === 0) continue
      out[k] = inner
      continue
    }
    if (v === '') continue
    out[k] = v
  }
  return out as Partial<DiscoveryInput>
}

export async function extractDiscoveryFromNotes(
  notes: string,
): Promise<ExtractResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart the dev server.',
    )
  }

  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
  const client = new Anthropic()

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    tools: [DISCOVERY_TOOL],
    tool_choice: { type: 'tool', name: 'record_discovery' },
    messages: [{ role: 'user', content: notes }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Model did not invoke the record_discovery tool.')
  }

  const raw = toolUse.input as Partial<DiscoveryInput>
  const discovery = clean(raw)
  const extractedFields = flattenFilledKeys(discovery as Record<string, unknown>)

  return { discovery, extractedFields, model }
}
