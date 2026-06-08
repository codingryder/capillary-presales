# CLAUDE.md — Capillary Presales Solutioning Tool (internal POC)

## What this is
An internal tool for Capillary Technologies' presales / Solution Architect team.

**Phase-1 POC scope ONLY:** a structured *discovery capture* feeding a *loyalty ROI /
business-case modeler*. The purpose of this codebase is to produce ONE demoable,
credible buyer-facing artifact (a loyalty business case) that proves the
"product-aware, loyalty-domain-aware" thesis and wins an executive sponsor.

This is a proof-of-concept, **not** the full platform. Optimise for speed-to-demo
and credibility of output, not for production hardening or scale.

## Hard design rules (do NOT violate)
1. **The LLM never does arithmetic.** All financial math runs in a deterministic,
   pure, typed TypeScript calculation engine in `/lib/calc`. If a prompt is asking
   the model to compute liability, breakage, ROI, or any number — stop and move
   that logic into the calc engine.
2. **The calc engine is unit-tested.** Every formula has tests with known
   inputs/outputs. This is non-negotiable: the audience is SAs and finance, and one
   wrong number permanently destroys trust in the whole tool.
3. **Show the working.** Every number displayed to a user must be traceable to its
   inputs and the formula used. No black-box outputs.
4. **The LLM is used for exactly two things:** (a) extracting structured fields from
   pasted discovery notes / call transcripts into the typed discovery model, and
   (b) writing narrative business-case prose *from numbers the calc engine already
   produced*. Never to compute, never to invent figures.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS — single app, no separate backend
- `@anthropic-ai/sdk` for extraction + narrative generation (model: a current Claude model)
- Supabase optional, only if saving deals between sessions is wanted; in-memory is fine for v1
- API key via env var only — never hard-coded, never committed

## Loyalty economics primer (so reasoning is correct)
These are the core concepts the calc engine models. **All formulas must be validated
with a Capillary SA / finance before the demo — treat the defaults below as
placeholders to be calibrated, not ground truth.**
- **Points liability**: outstanding unredeemed points × redemption value per point.
- **Breakage**: share of issued points expected never to be redeemed (revenue/margin upside).
- **Redemption rate**: redeemed points ÷ issued points over a period.
- **Earn/burn ratio**: points issued vs points redeemed; signals program health.
- **CLTV uplift**: modeled incremental margin from improved retention/frequency among members.
- **Incremental margin**: margin on member-driven incremental revenue, net of reward cost.

## Out of scope for v1 (do not build)
- CRM / Salesforce integration
- The product-capability model and requirement→blueprint mapper
- RFP / security-questionnaire autofill
- Effort / commercial estimator
- Multi-tenant / configurability (this is Capillary-internal, hard-code Capillary specifics)
- Auth beyond a trivial gate, if any

## Definition of done for the POC
A user can: paste/enter a prospect's current loyalty program details → get a clean,
sourced business case (current-state economics, modeled future-state on Capillary,
delta, and a narrative summary) → export or screen-share it. The numbers are
deterministic, tested, and explainable.
