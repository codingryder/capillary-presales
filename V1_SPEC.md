# V1 Spec — Discovery Capture + Loyalty ROI / Business-Case Modeler

## Goal
One screen-shareable deliverable: a credible loyalty **business case** for a prospect,
generated from structured discovery inputs. Built to win an internal sponsor.

## Core user flow
1. **Discovery intake** — SA enters or pastes a prospect's current loyalty program.
   Two paths into the same typed model:
   - Structured form (tiers, members, points issued/redeemed, expiry, AOV, frequency,
     reward cost, channels, current vendor if any).
   - Paste raw notes / call transcript → LLM extracts into the same structured model
     → SA reviews & corrects before anything is computed.
2. **Model current state** — calc engine computes current-state economics (liability,
   breakage, redemption rate, program cost, etc.) from the structured inputs.
3. **Model future state on Capillary** — apply configurable improvement assumptions
   (e.g. redemption lift, retention lift, breakage optimisation) to project future-state
   economics. Assumptions are explicit, editable, and labeled as assumptions.
4. **Delta + business case** — show current vs future side by side with the computed
   delta. LLM writes a narrative summary *from the computed numbers only*.
5. **Export** — print-to-PDF is enough for v1; a nicer deck export is a later nice-to-have.

## Data model (sketch — refine in code)
- `DiscoveryInput`: typed fields for everything in step 1. Every field optional but
  flagged when missing so the SA knows what's driving uncertainty.
- `EconomicsResult`: every computed metric, each carrying `{ value, inputs, formula }`
  so the UI can show the working.
- `Assumptions`: the editable future-state levers, with sensible labeled defaults.
- `BusinessCase`: current + future + delta + narrative.

## The calc engine (`/lib/calc`) — the heart of the POC
- Pure functions, fully typed, no side effects, no LLM calls.
- One module per metric where it helps clarity.
- Unit tests (Vitest or Jest) with hand-computed expected values for each formula.
- Round/format only at the display layer; compute in full precision.
- Every function returns enough metadata to render "show the working".

## LLM usage (strictly bounded)
Implemented via `@google/genai` against Gemini 2.5 Flash (override via `GEMINI_MODEL`).
- **Extraction**: Gemini structured-output mode (`responseMimeType: 'application/json'`
  + `responseSchema`) — forces JSON matching `DiscoveryInput`'s shape, no code fences
  to strip. Validate field-by-field, surface what was extracted for SA review.
  Never auto-trust extracted numbers.
- **Narrative**: input is the already-computed `BusinessCase` numbers (with each
  figure pre-formatted into a `displayValue` string the model must quote verbatim);
  output is plain prose. System prompt forbids introducing or altering any figure.

## UI
- Three views: Discovery → Review/Model → Business Case.
- Clean, presentation-grade output view (this is the thing a VP sees — make it look good).
- Tailwind; keep it simple and legible. Capillary brand polish can come once the
  thesis is proven.

## Suggested build order for the Claude Code session
1. Scaffold Next.js + TS + Tailwind, env setup for the Gemini key.
2. Define the types (`DiscoveryInput`, `EconomicsResult`, `Assumptions`, `BusinessCase`).
3. Build the calc engine + its tests FIRST, before any UI. Get the math right and proven.
4. Build the structured discovery form bound to the types.
5. Build the model/review view that runs the calc engine and shows the working.
6. Build the business-case view.
7. Add LLM extraction (paste → structured) as an enhancement to the form.
8. Add LLM narrative generation to the business-case view.
9. Print/export.

## Reminders
- Validate every formula and default with a real Capillary SA / finance before demoing.
- Do not drift into CRM, capability model, or RFP scope — see CLAUDE.md.
