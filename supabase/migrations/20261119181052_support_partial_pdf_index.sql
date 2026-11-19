alter table public.library_sources
  drop constraint library_sources_processing_status_check;

alter table public.library_sources
  add constraint library_sources_processing_status_check check (
    processing_status in ('pending', 'extracting', 'ready', 'ocr_required', 'partial', 'failed')
  );

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
      'simple', page.content, query.value,
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

update public.library_sources as source
set
  processing_status = 'partial',
  page_count = indexed.page_count,
  last_error = 'PDF extraction stopped after the indexed pages; remaining pages require another extractor.',
  indexed_at = now(),
  updated_at = now()
from (
  select source_id, count(*)::integer as page_count
  from public.library_pages
  group by source_id
) as indexed
where source.id = indexed.source_id
  and source.processing_status = 'failed'
  and indexed.page_count > 0;
