# Literature search architecture

## Status

The current product is a personal PDF search tool without AI-generated answers. The existing public `UX Literature` Storage bucket is the source of truth for original files. Postgres stores only a rebuildable search index: source identity, processing state, page text, checksums, and page numbers. Application authentication has been removed by product-owner decision.

## System boundaries

```text
Browser
  -> Next.js application on Vercel
     -> /api/search validates the query
        -> public search Edge Function
           -> service-role-only Postgres RPC
              -> GIN-indexed full-text search over library pages
     -> public source PDF at the matching page

Index command
  -> public index Edge Function
     -> discovers source PDFs in UX Literature
     -> claims one pending source
     -> extracts at most 25 pages per invocation
     -> upserts page text and checksums
     -> resumes until ready, partial, OCR-required, or failed
```

The browser and Vercel use only the Supabase project URL and publishable key. Platform-provided service-role credentials exist only inside Supabase Edge Functions. Extracted page text tables have RLS enabled, no client policies, and no `anon` or `authenticated` table grants. Only short search excerpts cross the server boundary.

## Implemented data model

- `library_sources`: rebuildable metadata keyed by bucket and storage path, checksum, processing status, page count, and safe error detail
- `library_pages`: extracted page text, PDF page number, optional printed page label, checksum, and generated `tsvector`
- `library_pages_search_idx`: GIN index over the generated search vector
- `search_library_pages`: service-role-only RPC using `websearch_to_tsquery`, `ts_rank_cd`, and bounded `ts_headline` excerpts

Processing states are `pending`, `extracting`, `ready`, `ocr_required`, `partial`, and `failed`. The source object is never copied into Postgres. Re-running the indexer skips unchanged ready sources and upserts page identities, so interrupted runs do not create duplicates.

## Current retrieval flow

1. The Next.js route accepts queries between 2 and 200 characters.
2. The search Edge Function calls the private RPC with a maximum of 24 results.
3. PostgreSQL parses web-style syntax using the language-neutral `simple` dictionary.
4. The GIN index selects matching pages and ranks them by cover density.
5. `ts_headline` returns only a short marked excerpt.
6. The UI renders marks without injecting HTML and links to `#page=<PDF page>` in the source file.

This is lexical retrieval: exact words and their normalized tokens match, but semantic synonyms are not inferred.

Long-running PDF processing must not execute inside a single browser request or depend on one short-lived Vercel function. The implementation should dispatch idempotent jobs to a durable worker or workflow service. The exact worker platform is a milestone decision because it affects recurring cost and deployment operations.

## Proposed components

### Next.js application

- App Router and React Server Components by default
- Supabase SSR bridge for authenticated server rendering
- Vercel AI SDK for bounded streaming responses
- server routes for question validation, retrieval orchestration, and answer streaming
- product components that preserve evidence type and citation identity through rendering

### Supabase

- Auth for identity and sessions
- the existing public `UX Literature` bucket for current source files, as explicitly chosen for this personal deployment
- a private bucket remains the recommended future location for derived page assets and any sensitive sources
- Postgres for document, job, chunk, conversation, and citation metadata
- pgvector for embeddings
- Row Level Security and least-privilege grants on every exposed table
- signed, short-lived source access generated only after authorization

### Ingestion worker

- validates MIME type, file signature, and size
- calculates a source checksum before processing
- extracts the embedded text layer when usable
- sends only pages requiring OCR through the OCR provider
- preserves printed page labels separately from zero- or one-based PDF page indexes
- creates semantic chunks with stable identifiers
- embeds chunks in bounded batches
- commits status transitions and actionable failures

## PDF ingestion pipeline

1. An authenticated user requests an upload slot.
2. The server creates a `document` record in `awaiting_upload` and issues a scoped upload destination.
3. The client uploads to a private storage path owned by the user or workspace.
4. A finalize request validates the stored object and checksum, then creates or reuses an idempotent processing job.
5. The worker changes the document to `extracting` and inspects each page for a usable text layer.
6. Pages without usable text enter `ocr_pending`, followed by `ocr_processing`.
7. Extracted pages are normalized while preserving headings, paragraphs, lists, tables, page indexes, and detected printed page labels.
8. Semantic chunks are created with controlled overlap and content checksums.
9. Chunks are embedded using a pinned model and dimension.
10. The worker atomically marks the document `ready`, or records a bounded retryable or terminal failure.

Every stage uses a deterministic idempotency key derived from the document ID, source checksum, pipeline version, and stage. Retries upsert stage outputs rather than append uncontrolled duplicates.

## OCR strategy

- Prefer direct extraction when the text layer passes minimum character density and quality checks.
- Run OCR per page, not automatically for the entire document.
- Record `direct`, `ocr`, or `mixed` as the extraction method.
- Retain confidence and provider metadata without retaining unnecessary provider payloads.
- Keep OCR behind an adapter so the provider can change without rewriting ingestion.
- Define page and document limits before provider selection because OCR has material cost implications.

## Processing states

```text
awaiting_upload -> queued -> validating -> extracting
  -> ocr_pending -> ocr_processing
  -> chunking -> embedding -> ready

Any processing state -> retry_pending -> prior safe stage
Any processing state -> failed
awaiting_upload -> cancelled
```

Store current state, progress counts, attempt count, pipeline version, last error code, sanitized error detail, and timestamps. Do not store private document passages in general application logs.

## Proposed data model

Schema details will be committed as version-controlled migrations only after the ownership model is confirmed.

### Core entities

- `workspaces`: future-safe ownership boundary, even if the first release is single-user
- `workspace_members`: role and membership state
- `documents`: bibliographic metadata, private storage identity, checksum, extraction method, and processing state
- `document_pages`: PDF index, printed page label, extracted text checksum, method, and OCR status
- `document_sections`: normalized chapter and section hierarchy
- `document_chunks`: ordered text, page span, section reference, token count, checksum, embedding model, and vector
- `ingestion_jobs`: idempotency key, stage, attempts, lease, progress, and sanitized errors
- `conversations` and `messages`: user-scoped chat history
- `answer_claims`: structured literature, interpretation, or limitation blocks
- `citations`: immutable links from a literature claim to chunk and source metadata

### Important constraints

- unique document source checksum within an ownership boundary and pipeline policy
- unique chunk identity for document, pipeline version, and chunk index
- separate `printed_page_label` and `pdf_page_index`
- foreign keys from citations to claims, chunks, documents, and pages
- pinned embedding model and dimensions per chunk collection
- no model-generated citation metadata

## Retrieval and answer generation

1. Validate the authenticated request, ownership scope, length, and rate limit.
2. Normalize or expand the question only when evaluation shows a benefit.
3. Generate a query embedding using the same pinned model as stored chunks.
4. Run user-scoped vector retrieval with metadata filters.
5. Optionally combine keyword results and rerank a bounded candidate set.
6. Deduplicate overlapping chunks and enforce a context token budget.
7. Treat retrieved text as untrusted content and delimit it from system instructions.
8. Ask the model for structured answer blocks: direct answer, literature claims, interpretation, and limitations.
9. Resolve citations from retrieved database identities, never from model-authored titles or page numbers.
10. Validate that every literature block has at least one authorized citation before streaming or persisting it.

If evidence is insufficient, the answer must state that limitation and must not attach invented citations. General guidance remains explicitly labeled as interpretation.

## Authorization boundaries

- All user-accessible tables use RLS plus explicit grants.
- `anon` receives no document, chunk, message, or source access.
- `authenticated` receives only operations required by the product and only within owned workspaces.
- Ownership policies use stable membership rows and `auth.uid()`, not user-editable metadata.
- Service-role access is limited to trusted server and worker environments.
- Current literature PDFs use public object URLs by product-owner choice; the application must clearly treat them as publicly downloadable.
- Derived page assets, extracted text, chunks, and embeddings remain private and user-scoped.
- Source previews use short-lived signed access after an authorization check.
- Retrieval functions accept the caller identity from the database session or a trusted server boundary; a client-provided workspace ID is never sufficient authorization.
- Views exposed to clients use `security_invoker = true` where supported.

RLS policy tests must cover allow and deny paths for select, insert, update, and delete. Policies and grants ship in the same migration.

## Failure and retry behavior

- Every job stage is idempotent and has a bounded retry policy.
- Workers use leases so abandoned work can be recovered without concurrent duplication.
- Provider timeouts, rate limits, malformed PDFs, password-protected files, OCR failures, and embedding failures have distinct error codes.
- Partial outputs are either versioned and reusable or removed by a dedicated cleanup stage.
- Users see a safe, actionable status. Internal traces contain identifiers and timings, not full passages or secrets.
- A dead-letter state supports operator review without silently retrying forever.

## Security considerations

- Validate file signatures in addition to extensions and MIME headers.
- Enforce upload and extracted-text size limits.
- Scan or sandbox untrusted document parsing.
- Treat instructions inside uploaded documents as data, not prompts.
- Keep service-role and OpenAI keys server-only.
- Apply per-user request, upload, OCR, and token budgets.
- Do not expose raw chunk exports or features that reconstruct copyrighted books.
- Use concise paraphrases and configured quotation limits.

## Trade-offs and open decisions

1. **Ownership model:** decided as personal-only. User-owned rows reference `auth.users` directly and do not include a workspace abstraction.
2. **OCR provider:** quality, language support, region, retention, and per-page cost must be compared using representative books.
3. **Durable worker:** Vercel Workflow, Supabase Queues plus workers, or another job platform must be selected based on duration and operational cost.
4. **Embedding model and dimensions:** must be pinned before the vector column is created because changing dimensions requires re-embedding and schema work.
5. **Source preview:** PDF rendering strategy must balance navigation accuracy, copyright protection, and browser performance.

## Prioritized milestones

1. **Frontend and repository foundation:** application shell, design tokens, explicit mock evidence states, environment contract, lint/type/test/build checks. Implemented in this milestone.
2. **Personal ownership and auth:** connect Supabase SSR auth, protect application routes, and disable self-registration. Implemented locally; hosted auth configuration still requires verification.
3. **Schema and RLS:** create versioned migrations for user-owned documents, pages, jobs, and private storage policies with database tests. Implemented locally; hosted migration application is pending verification.
4. **Public library connection:** list `UX Literature` through a public, read-only server boundary, expose public object links in the library, and keep Storage as the only catalog source of truth. Implemented.
5. **Durable ingestion proof:** direct extraction, page metadata, checksum-based idempotency, processing UI, and one representative PDF fixture.
6. **OCR fallback:** provider adapter, scanned-page detection, cost limits, retries, and evaluation fixtures.
7. **Embedding and retrieval:** pinned model, chunks, vector RPC, metadata filters, hybrid evaluation set, and retrieval metrics.
8. **Grounded answer streaming:** structured claims, server-side citation resolution, insufficient-evidence behavior, and prompt-injection tests.
9. **Source inspection and hardening:** authorized preview, accessibility, rate limits, observability, recovery tooling, and end-to-end tests.
