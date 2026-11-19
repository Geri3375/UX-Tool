# UX Literature Search

A personal UX literature search application. The public Supabase Storage bucket `UX Literature` remains the source of truth for original files. A rebuildable page-text index in Postgres provides keyword search without OpenAI or another language model.

## Current milestone

- Next.js App Router with React and TypeScript
- Tailwind CSS design tokens and a responsive product shell
- a focused PDF keyword-search interface with highlighted excerpts
- direct source links that open the matching PDF page
- an environment-variable contract with no secret values
- an architecture record for the current search system and optional future extensions
- baseline lint, type, unit-test, and production-build scripts
- Supabase SSR clients without an application login gate
- a versioned document, page, ingestion-job, private-storage, and RLS migration
- database policy test definitions under `supabase/tests`
- live document-library listing from the `UX Literature` bucket through a public, read-only Edge Function
- direct public source links without duplicate catalogue rows in the application database
- version-controlled full-text search schema with a GIN index
- resumable PDF text extraction in 25-page Edge Function batches
- private extracted text tables with no `anon` or `authenticated` grants
- five fully indexed PDFs and one partially indexed PDF (999 searchable pages total)

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

To discover new or changed PDFs and rebuild their page index:

```bash
npm run index:library
```

## Environment

Copy `.env.example` to `.env.local`. Never commit `.env.local`. The application needs only the Supabase project URL and publishable key; Supabase Edge Functions use their platform-provided server credential.

Without the public Supabase variables, the application cannot load its library. With them configured, application routes are public and require no Supabase identity.

## Architecture

See [`docs/rag-architecture.md`](docs/rag-architecture.md) for the ingestion, OCR, data, retrieval, authorization, and milestone plan.

## Search behavior

Search uses PostgreSQL full-text search with the language-neutral `simple` configuration. It supports quoted phrases, `OR`, and excluded terms such as `-prototype`. Results contain a short highlighted passage and PDF page number; extracted full pages are never returned to the browser.

One PDF (`Screen und Interface Design`) is currently indexed through PDF page 200 and is explicitly recorded as `partial` because the parser repeatedly fails beyond that point. OCR is not yet implemented for image-only pages. There is no AI-generated answer feature.
