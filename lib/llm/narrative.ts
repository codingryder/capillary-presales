import Anthropic from '@anthropic-ai/sdk'
import type { Assumptions } from '@/lib/types/assumptions'
import type { DiscoveryInput } from '@/lib/types/discovery'
import type { BusinessCase } from '@/lib/types/business-case'
import type { Metric } from '@/lib/types/metric'
import { buildBusinessCase } from '@/lib/calc/business-case'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

export const NARRATIVE_SYSTEM_PROMPT = `You are writing the executive-summary section of a loyalty business case prepared by Capillary Technologies (an enterprise loyalty platform) for a prospect.

The figures provided below have been computed deterministically by our calc engine. They are fixed and authoritative.

Hard rules — these are non-negotiable:
1. Use ONLY numbers that appear in the JSON payload you are given. Do NOT derive, multiply, percentage-shift, average, or compute any new figure.
2. If a number is missing (null) from the payload, do not estimate. Acknowledge uncertainty in plain language or omit that point.
3. Format currency exactly as it appears in the payload's "displayValue" strings — do not change locale, scale, or precision.
4. Tone: executive, calm, specific. No marketing language. No superlatives ("unprecedented", "game-changing", "industry-leading"). No exclamation marks. No hype.
5. Output plain prose only — no markdown headings, no bullet lists, no numbered lists.
6. Length: 2–3 short paragraphs, roughly 120–200 words total.

Structure:
- Paragraph 1 (headline): Lead with the annual incremental margin and the 3-year net value. Mention payback period if present.
- Paragraph 2 (what changes): How member revenue, gross margin, redemption rate, and breakage value shift between current and future state. Quote the magnitudes from the payload.
- Paragraph 3 (qualitative): Ground the case in the prospect's specific posture, drawing on the "qualitative" notes field. If the qualitative field is empty or null, omit this paragraph entirely.

End on a sober, specific note. Do not solicit follow-up or recommend next steps unless the qualitative field clearly directs it.`

/**
 * What we hand to the model. Drop NaN metrics to null, and pre-format
 * currency-typed values so the model can quote them verbatim rather than
 * re-formatting numbers we'd then have to verify.
 */
type LLMPayload = ReturnType<typeof toLLMPayload>

function fmtCurrency(value: number, currency: string): string {
  const locale =
    currency === 'INR'
      ? 'en-IN'
      : currency === 'GBP'
        ? 'en-GB'
        : currency === 'AED'
          ? 'en-AE'
          : currency === 'EUR'
            ? 'en-IE'
            : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function metricForLLM(m: Metric, currency: string) {
  const v = m.value as number
  if (!Number.isFinite(v)) return null
  switch (m.unit) {
    case 'currency':
      return { value: v, unit: 'currency', displayValue: fmtCurrency(v, currency) }
    case 'percent':
      return {
        value: v,
        unit: 'percent',
        displayValue: `${(v * 100).toFixed(1)}%`,
      }
    case 'months':
      return { value: v, unit: 'months', displayValue: `${v.toFixed(1)} months` }
    case 'ratio':
      return { value: v, unit: 'ratio', displayValue: `${v.toFixed(2)}×` }
    default:
      return { value: v, unit: m.unit, displayValue: String(Math.round(v)) }
  }
}

function toLLMPayload(bc: BusinessCase) {
  const currency = bc.discovery.prospect?.currency ?? 'INR'
  const m = (metric: Metric) => metricForLLM(metric, currency)
  return {
    prospect: bc.discovery.prospect,
    currency,
    qualitative: bc.discovery.notes ?? null,
    current: {
      memberRevenue: m(bc.current.memberRevenue),
      grossMargin: m(bc.current.grossMargin),
      redemptionRate: m(bc.current.redemptionRate),
      breakageRate: m(bc.current.breakageRate),
      breakageValue: m(bc.current.breakageValue),
      pointsLiability: m(bc.current.pointsLiability),
      rewardSpend: m(bc.current.rewardSpend),
    },
    future: {
      memberRevenue: m(bc.future.memberRevenue),
      grossMargin: m(bc.future.grossMargin),
      redemptionRate: m(bc.future.redemptionRate),
      breakageRate: m(bc.future.breakageRate),
      breakageValue: m(bc.future.breakageValue),
      rewardSpend: m(bc.future.rewardSpend),
    },
    delta: {
      memberRevenue: m(bc.delta.memberRevenue),
      grossMargin: m(bc.delta.grossMargin),
      redemptionRate: m(bc.delta.redemptionRate),
      breakageValue: m(bc.delta.breakageValue),
      programCost: m(bc.delta.programCost),
    },
    headline: {
      annualUplift: m(bc.headline.annualUplift),
      threeYearNetValue: m(bc.headline.threeYearNetValue),
      paybackMonths: bc.headline.paybackMonths
        ? m(bc.headline.paybackMonths)
        : null,
    },
    assumptions: {
      ...bc.assumptions,
      _notes:
        'These uplift assumptions are placeholders pending Capillary SA / finance calibration. Do not present them as guarantees.',
    },
    missingInputs: bc.missingInputs,
  } as const
}

export type NarrativeResult = {
  narrative: string
  model: string
  payload: LLMPayload
}

export async function generateNarrative(
  discovery: DiscoveryInput,
  assumptions: Assumptions,
): Promise<NarrativeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart the dev server.',
    )
  }
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
  const client = new Anthropic()

  const bc = buildBusinessCase(discovery, assumptions)
  const payload = toLLMPayload(bc)
  const payloadJson = JSON.stringify(payload, null, 2)

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content:
          `BUSINESS CASE PAYLOAD — the numbers below are fixed and authoritative. Quote the "displayValue" strings verbatim:\n\n` +
          payloadJson +
          `\n\nNow write the executive summary, following all rules in the system prompt.`,
      },
    ],
  })

  const narrative = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('\n')
    .trim()

  if (!narrative) {
    throw new Error('Model returned an empty narrative.')
  }

  return { narrative, model, payload }
}
