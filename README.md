# UX Knowledge Assistant

A public, evidence-based UX research assistant foundation. The library reads directly from the public `UX Literature` Storage bucket, which remains the catalogue source of truth. Authentication has been removed by product-owner decision. Document ingestion, retrieval, citations, and OpenAI are not connected yet.

## Current milestone

- Next.js App Router with React and TypeScript
- Tailwind CSS design tokens and a responsive product shell
- explicit visual separation for literature, AI interpretation, and evidence limitations
- an interface preview that is clearly marked as illustrative
- an environment-variable contract with no secret values
- a RAG architecture and prioritized delivery plan
- baseline lint, type, unit-test, and production-build scripts
- Supabase SSR clients without an application login gate
- a versioned document, page, ingestion-job, private-storage, and RLS migration
- database policy test definitions under `supabase/tests`
- live document-library listing from the `UX Literature` bucket through a public, read-only Edge Function
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

Without the public Supabase variables, the application cannot load its library. With them configured, application routes are public and require no Supabase identity.

## Architecture

See [`docs/rag-architecture.md`](docs/rag-architecture.md) for the ingestion, OCR, data, retrieval, authorization, and milestone plan.

## Important limitation

The visible answer and source are mock interface content. They are labeled as illustrative and must not be interpreted as retrieved evidence.

The library is live, but its files are not yet extracted, chunked, embedded, or available to chat retrieval.
