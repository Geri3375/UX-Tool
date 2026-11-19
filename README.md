# UX Knowledge Assistant

A private, evidence-based UX research assistant. Supabase SSR authentication and the personal-only schema are implemented. The authenticated library reads directly from the public `UX Literature` Storage bucket, which remains the catalogue source of truth. Document ingestion, retrieval, citations, and OpenAI are not connected yet.

## Current milestone

- Next.js App Router with React and TypeScript
- Tailwind CSS design tokens and a responsive product shell
- explicit visual separation for literature, AI interpretation, and evidence limitations
- an interface preview that is clearly marked as illustrative
- an environment-variable contract with no secret values
- a RAG architecture and prioritized delivery plan
- baseline lint, type, unit-test, and production-build scripts
- personal-only Supabase SSR clients, protected-route proxy, and magic-link login
- a versioned document, page, ingestion-job, private-storage, and RLS migration
- database policy test definitions under `supabase/tests`
- live document-library listing from the `UX Literature` bucket through an authenticated Edge Function
- direct public source links without duplicate catalogue rows in the application database

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run check
npm run build
```

## Environment

Copy `.env.example` to `.env.local` only when integrations are implemented. Never commit `.env.local` or place `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in a `NEXT_PUBLIC_` variable.

Without the public Supabase variables, the interface remains an unprotected local preview. With them configured, application routes require a verified Supabase identity.

Magic-link sign-in uses `shouldCreateUser: false`. Create the sole approved user in Supabase Auth before testing login.

## Architecture

See [`docs/rag-architecture.md`](docs/rag-architecture.md) for the ingestion, OCR, data, retrieval, authorization, and milestone plan.

## Important limitation

The visible answer and source are mock interface content. They are labeled as illustrative and must not be interpreted as retrieved evidence.

The library is live, but its files are not yet extracted, chunked, embedded, or available to chat retrieval.
