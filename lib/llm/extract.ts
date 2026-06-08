import { GoogleGenAI } from '@google/genai'
import type { DiscoveryInput } from '@/lib/types/discovery'
import { DISCOVERY_SCHEMA, EXTRACTION_SYSTEM_PROMPT } from './schema'

export type ExtractResult = {
  discovery: Partial<DiscoveryInput>
  extractedFields: string[]
  model: string
}

const DEFAULT_MODEL = 'gemini-2.5-flash'

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in .env.local (local dev) or in your Vercel project Environment Variables (production), then restart / redeploy.',
    )
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model,
    contents: notes,
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: DISCOVERY_SCHEMA as any,
      temperature: 0.0,
    },
  })

  const text = response.text ?? ''
  if (!text.trim()) {
    throw new Error('Model returned an empty response.')
  }

  let raw: Partial<DiscoveryInput>
  try {
    raw = JSON.parse(text) as Partial<DiscoveryInput>
  } catch {
    throw new Error(
      `Model response was not valid JSON. First 200 chars: ${text.slice(0, 200)}`,
    )
  }

  const discovery = clean(raw)
  const extractedFields = flattenFilledKeys(discovery as Record<string, unknown>)

  return { discovery, extractedFields, model }
}
