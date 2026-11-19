-- Personal-only document ownership foundation.
-- Embeddings and retrieval tables are intentionally deferred until the model
-- and dimensions are pinned.

create extension if not exists pgcrypto with schema extensions;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  author text,
  edition text,
  publication_year integer check (publication_year between 1400 and 2200),
  isbn text,
  storage_bucket text not null default 'source-documents',
  storage_path text not null,
  source_checksum text,
  extraction_method text check (extraction_method in ('direct', 'ocr', 'mixed')),
  processing_status text not null default 'awaiting_upload' check (
    processing_status in (
      'awaiting_upload', 'queued', 'validating', 'extracting',
      'ocr_pending', 'ocr_processing', 'chunking', 'embedding',
      'ready', 'retry_pending', 'failed', 'cancelled'
    )
  ),
  pipeline_version text,
  page_count integer check (page_count is null or page_count >= 0),
  last_error_code text,
  last_error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, storage_bucket, storage_path),
  unique (owner_id, source_checksum)
);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  pdf_page_index integer not null check (pdf_page_index >= 0),
  printed_page_label text,
  section_title text,
  extraction_method text not null check (extraction_method in ('direct', 'ocr')),
  extraction_status text not null default 'pending' check (
    extraction_status in ('pending', 'processing', 'complete', 'failed')
  ),
  content_checksum text,
  character_count integer check (character_count is null or character_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, pdf_page_index)
);

create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  idempotency_key text not null unique,
  stage text not null,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'retry_pending', 'complete', 'failed', 'cancelled')
  ),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_total integer check (progress_total is null or progress_total >= 0),
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  last_error_code text,
  last_error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index documents_owner_created_idx
  on public.documents (owner_id, created_at desc);
create index documents_owner_status_idx
  on public.documents (owner_id, processing_status);
create index document_pages_document_idx
  on public.document_pages (document_id, pdf_page_index);
create index ingestion_jobs_document_idx
  on public.ingestion_jobs (document_id, created_at desc);
create index ingestion_jobs_dispatch_idx
  on public.ingestion_jobs (status, next_attempt_at)
  where status in ('queued', 'retry_pending');

alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.ingestion_jobs enable row level security;

revoke all on table public.documents from anon, authenticated;
revoke all on table public.document_pages from anon, authenticated;
revoke all on table public.ingestion_jobs from anon, authenticated;

grant select, insert, update, delete on table public.documents to authenticated;
grant select on table public.document_pages to authenticated;
grant select on table public.ingestion_jobs to authenticated;

create policy "Users can read their own documents"
  on public.documents for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create their own documents"
  on public.documents for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own documents"
  on public.documents for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can read pages from their own documents"
  on public.document_pages for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = document_pages.document_id
        and documents.owner_id = (select auth.uid())
    )
  );

create policy "Users can read jobs for their own documents"
  on public.ingestion_jobs for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = ingestion_jobs.document_id
        and documents.owner_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'source-documents',
  'source-documents',
  false,
  104857600,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own source documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own source documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own source documents"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own source documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
