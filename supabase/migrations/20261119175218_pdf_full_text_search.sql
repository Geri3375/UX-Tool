-- Search index for the public "UX Literature" storage bucket.
-- The bucket remains the source of truth; these rows are a rebuildable index.

create table public.library_sources (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null,
  storage_path text not null,
  title text not null check (char_length(trim(title)) between 1 and 500),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  content_checksum text,
  processing_status text not null default 'pending' check (
    processing_status in ('pending', 'extracting', 'ready', 'ocr_required', 'partial', 'failed')
  ),
  page_count integer check (page_count is null or page_count >= 0),
  indexed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.library_pages (
  id bigint generated always as identity primary key,
  source_id uuid not null references public.library_sources(id) on delete cascade,
  pdf_page_number integer not null check (pdf_page_number >= 1),
  printed_page_label text,
  section_title text,
  content text not null,
  content_checksum text not null,
  character_count integer not null check (character_count >= 0),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(section_title, '') || ' ' || content)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, pdf_page_number)
);

create index library_sources_status_idx
  on public.library_sources (processing_status, indexed_at desc);
create index library_pages_source_page_idx
  on public.library_pages (source_id, pdf_page_number);
create index library_pages_search_idx
  on public.library_pages using gin (search_vector);

alter table public.library_sources enable row level security;
alter table public.library_pages enable row level security;

revoke all on table public.library_sources from anon, authenticated;
revoke all on table public.library_pages from anon, authenticated;

create or replace function public.search_library_pages(
  query_text text,
  result_limit integer default 20
)
returns table (
  source_id uuid,
  title text,
  storage_path text,
  pdf_page_number integer,
  printed_page_label text,
  section_title text,
  excerpt text,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('simple', trim(query_text)) as value
  )
  select
    source.id,
    source.title,
    source.storage_path,
    page.pdf_page_number,
    page.printed_page_label,
    page.section_title,
    ts_headline(
      'simple',
      page.content,
      query.value,
      'StartSel=[[[, StopSel=]]], MaxWords=42, MinWords=18, ShortWord=3, HighlightAll=false'
    ) as excerpt,
    ts_rank_cd(page.search_vector, query.value) as rank
  from public.library_pages as page
  join public.library_sources as source on source.id = page.source_id
  cross join query
  where
    char_length(trim(query_text)) between 2 and 200
    and source.processing_status in ('ready', 'ocr_required', 'partial')
    and page.search_vector @@ query.value
  order by rank desc, source.title, page.pdf_page_number
  limit least(greatest(result_limit, 1), 50);
$$;

revoke all on function public.search_library_pages(text, integer) from public, anon, authenticated;
grant execute on function public.search_library_pages(text, integer) to service_role;
