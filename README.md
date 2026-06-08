# Capillary Presales Solutioning Tool

Internal POC for Capillary's presales / Solution Architect team.

**Phase-1 scope:** structured discovery capture → deterministic loyalty business-case modeler.
One demoable, credible buyer-facing artifact. See `CLAUDE.md` and `V1_SPEC.md`.

## Hard rules

1. The LLM **never** does arithmetic — all math runs in `lib/calc`, a pure typed engine.
2. Every formula has a unit test with hand-computed expected values.
3. Every displayed number is traceable to its inputs and formula ("show the working").
4. LLM is used only for (a) extracting structured fields from notes and (b) writing
   narrative prose from numbers the calc engine already produced.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- `@google/genai` (Gemini 2.5 Flash) for extraction + narrative
- Vitest for the calc-engine test suite
- In-memory state for v1 (no DB)

## Local setup

```sh
npm install
cp .env.local.example .env.local   # fill in GEMINI_API_KEY
npm run dev                        # Next.js dev server
npm test                           # Vitest in watch mode
npm run test:run                   # one-shot test run
```

Get a Google AI Studio API key at https://aistudio.google.com/apikey.

## Project layout

```
app/              Next.js App Router pages
lib/
  calc/           Pure, typed calc engine (unit-tested)
  types/          DiscoveryInput, EconomicsResult, Assumptions, BusinessCase
```
