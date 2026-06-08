/**
 * Anthropic tool definition that mirrors DiscoveryInput. We use tool_use
 * (with tool_choice forcing this specific tool) to make extraction return
 * a validated, structured payload instead of free-form JSON we have to
 * parse defensively.
 *
 * Keep field names in lock-step with `lib/types/discovery.ts` — the merged
 * payload is fed straight into the store and the calc engine.
 */
export const DISCOVERY_TOOL = {
  name: 'record_discovery',
  description:
    "Record extracted facts about the prospect's current loyalty program. " +
    'Only include fields that are explicitly stated in the notes. Never invent ' +
    'numbers or compute derived values.',
  input_schema: {
    type: 'object',
    properties: {
      prospect: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Prospect company name.' },
          industry: { type: 'string', description: "Industry vertical, e.g. 'Fashion & Apparel'." },
          region: { type: 'string', description: 'Country or region.' },
          currency: {
            type: 'string',
            enum: ['INR', 'USD', 'AED', 'GBP', 'EUR'],
            description: 'ISO 4217 code derived from any currency symbol or name mentioned.',
          },
        },
      },
      program: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          vendor: {
            type: 'string',
            description: "Current loyalty vendor, or 'in-house' for homegrown.",
          },
          launchYear: { type: 'integer' },
        },
      },
      members: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          active: { type: 'number' },
          lapsed: { type: 'number' },
        },
      },
      timeframeMonths: {
        type: 'number',
        description:
          'The period (in months) covered by the pointsIssued / pointsRedeemed figures. ' +
          'If the notes say "last year" use 12; "last six months" → 6. Omit if unclear.',
      },
      pointsIssued: { type: 'number', description: 'Points issued during the period above.' },
      pointsRedeemed: { type: 'number', description: 'Points redeemed during the period above.' },
      outstandingPoints: {
        type: 'number',
        description: 'Unredeemed, unexpired points currently on member balances.',
      },
      pointValue: {
        type: 'number',
        description: 'Value of one point at redemption, in the local currency (e.g. ₹0.10 → 0.1).',
      },
      expiryMonths: { type: 'number' },
      averageOrderValue: { type: 'number' },
      purchaseFrequencyPerYear: { type: 'number' },
      rewardCostPctOfRevenue: {
        type: 'number',
        description: 'Fraction 0..1. If the notes say "5%", record 0.05.',
      },
      grossMarginPct: {
        type: 'number',
        description: 'Fraction 0..1. If the notes say "30%", record 0.30.',
      },
      annualMemberRevenue: { type: 'number' },
      channels: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['web', 'app', 'pos', 'callcenter', 'partner', 'other'],
        },
      },
      notes: {
        type: 'string',
        description:
          'A short (max ~3 sentences) qualitative summary of the program\'s posture, ' +
          'pain points, or strategic context worth carrying into the narrative. ' +
          'Do NOT restate the numeric fields here.',
      },
    },
  },
} as const

export const EXTRACTION_SYSTEM_PROMPT = `You are a presales discovery analyst at Capillary Technologies, an enterprise loyalty platform. Your job is to extract structured facts about a prospect's CURRENT loyalty program from raw notes or a call transcript.

Hard rules — these are non-negotiable:
1. Output ONLY via the record_discovery tool. No prose.
2. NEVER invent a number. If a field is not explicitly stated in the notes, OMIT it. Do not estimate, infer, or fill with industry averages.
3. NEVER perform calculations. If the notes say "₹50M issued in 6 months" record { pointsIssued: 50000000, timeframeMonths: 6 }. Do NOT annualise. The calc engine handles all math.
4. Percentages stated as "X%" must be recorded as the FRACTION (5% → 0.05, not 5).
5. Lakh / crore notation: 1 lakh = 100,000; 1 crore = 10,000,000. Convert to raw numbers.
6. Currency detection: ₹/Rs/INR → "INR"; $/USD → "USD"; AED/dh → "AED"; £/GBP → "GBP"; €/EUR → "EUR".
7. If the notes mention what Capillary or the SA would propose / promise / project, IGNORE it. You are only recording the current-state baseline.
8. The "notes" field is for short qualitative context only — do not restate any number that already has its own structured field.`
