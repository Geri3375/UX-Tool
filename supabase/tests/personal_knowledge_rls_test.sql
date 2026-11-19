begin;

set local search_path = public, extensions;

select plan(20);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.documents'::regclass),
  'documents has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.document_pages'::regclass),
  'document_pages has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ingestion_jobs'::regclass),
  'ingestion_jobs has RLS enabled'
);

select ok(not has_table_privilege('anon', 'public.documents', 'select'), 'anon cannot read documents');
select ok(not has_table_privilege('anon', 'public.documents', 'insert'), 'anon cannot insert documents');
select ok(not has_table_privilege('anon', 'public.document_pages', 'select'), 'anon cannot read pages');
select ok(not has_table_privilege('anon', 'public.ingestion_jobs', 'select'), 'anon cannot read jobs');

select ok(has_table_privilege('authenticated', 'public.documents', 'select'), 'authenticated can select documents');
select ok(has_table_privilege('authenticated', 'public.documents', 'insert'), 'authenticated can insert documents');
select ok(has_table_privilege('authenticated', 'public.documents', 'update'), 'authenticated can update documents');
select ok(has_table_privilege('authenticated', 'public.documents', 'delete'), 'authenticated can delete documents');
select ok(has_table_privilege('authenticated', 'public.document_pages', 'select'), 'authenticated can select pages');
select ok(not has_table_privilege('authenticated', 'public.document_pages', 'insert'), 'authenticated cannot insert pages');
select ok(has_table_privilege('authenticated', 'public.ingestion_jobs', 'select'), 'authenticated can select jobs');
select ok(not has_table_privilege('authenticated', 'public.ingestion_jobs', 'insert'), 'authenticated cannot insert jobs');

select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'documents'$$,
  array[4::bigint],
  'documents has four operation-specific policies'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'document_pages'$$,
  array[1::bigint],
  'document_pages has one read policy'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'ingestion_jobs'$$,
  array[1::bigint],
  'ingestion_jobs has one read policy'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'Users can % their own source documents'$$,
  array[4::bigint],
  'private storage has select, insert, update, and delete policies'
);
select results_eq(
  $$select count(*)::bigint from storage.buckets where id = 'source-documents' and public = false$$,
  array[1::bigint],
  'source bucket is private'
);

select * from finish();
rollback;
