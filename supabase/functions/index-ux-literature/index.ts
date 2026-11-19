import { createHash } from "node:crypto";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import { getDocumentProxy } from "npm:unpdf@2.2.1";

const bucket = "UX Literature";
const corsHeaders = { "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Origin": "*" };
const checksum = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const titleFromPath = (path: string) => (path.split("/").at(-1) ?? path).replace(/\.pdf$/i, "").replaceAll(/[_-]+/g, " ").trim();

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    const { data: objects, error: listError } = await supabase.storage.from(bucket).list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (listError) throw listError;
    const pdfs = (objects ?? []).filter((item) => item.id && item.name.toLowerCase().endsWith(".pdf"));
    const { data: existing, error: existingError } = await supabase.from("library_sources").select("storage_path,size_bytes,processing_status").eq("storage_bucket", bucket);
    if (existingError) throw existingError;
    const existingByPath = new Map((existing ?? []).map((source) => [source.storage_path, source]));
    for (const item of pdfs) {
      const size = Number(item.metadata?.size ?? 0);
      const current = existingByPath.get(item.name);
      if (!current) {
        const { error } = await supabase.from("library_sources").insert({ storage_bucket: bucket, storage_path: item.name, title: titleFromPath(item.name), size_bytes: size, processing_status: "pending" });
        if (error) throw error;
      } else if (current.size_bytes !== size && current.processing_status !== "extracting") {
        const { error } = await supabase.from("library_sources").update({ size_bytes: size, processing_status: "pending", updated_at: new Date().toISOString() }).eq("storage_bucket", bucket).eq("storage_path", item.name);
        if (error) throw error;
      }
    }
    const { data: source, error: sourceError } = await supabase.from("library_sources").select("id,storage_path,processing_status").eq("storage_bucket", bucket).in("processing_status", ["extracting", "pending"]).order("processing_status").order("storage_path").limit(1).maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) return Response.json({ processed: false, message: "Library index is up to date." }, { headers: corsHeaders });
    if (source.processing_status === "pending") {
      const { data: claimed, error: claimError } = await supabase.from("library_sources").update({ processing_status: "extracting", last_error: null, updated_at: new Date().toISOString() }).eq("id", source.id).eq("processing_status", "pending").select("id").maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return Response.json({ processed: true, message: "Another indexer claimed the next document." }, { headers: corsHeaders });
    }
    try {
      const { data: pdf, error: downloadError } = await supabase.storage.from(bucket).download(source.storage_path);
      if (downloadError) throw downloadError;
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      const proxy = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 });
      const { data: latestPage } = await supabase.from("library_pages").select("pdf_page_number").eq("source_id", source.id).order("pdf_page_number", { ascending: false }).limit(1).maybeSingle();
      const firstPage = (latestPage?.pdf_page_number ?? 0) + 1;
      const lastPage = Math.min(firstPage + 24, proxy.numPages);
      const rows = [];
      for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
        const page = await proxy.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const content = textContent.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("").replaceAll(/[ \t]+\n/g, "\n").replaceAll(/\n{3,}/g, "\n\n").trim();
        rows.push({ source_id: source.id, pdf_page_number: pageNumber, content, content_checksum: checksum(content), character_count: content.length, updated_at: new Date().toISOString() });
      }
      const { error: pageError } = await supabase.from("library_pages").upsert(rows, { onConflict: "source_id,pdf_page_number" });
      if (pageError) throw pageError;
      if (lastPage < proxy.numPages) return Response.json({ processed: true, message: `${source.storage_path}: pages ${firstPage}–${lastPage} indexed.` }, { headers: corsHeaders });

      const { data: pageStats, error: statsError } = await supabase.from("library_pages").select("character_count").eq("source_id", source.id);
      if (statsError) throw statsError;
      const characterCount = (pageStats ?? []).reduce((total, page) => total + page.character_count, 0);
      const status = characterCount < Math.max(500, proxy.numPages * 40) ? "ocr_required" : "ready";
      const { error: finishError } = await supabase.from("library_sources").update({ content_checksum: checksum(bytes), processing_status: status, page_count: proxy.numPages, indexed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", source.id);
      if (finishError) throw finishError;
      return Response.json({ processed: true, message: `${source.storage_path}: ${proxy.numPages} pages indexed (${status}).` }, { headers: corsHeaders });
    } catch (error) {
      await supabase.from("library_sources").update({ processing_status: "failed", last_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown extraction error", updated_at: new Date().toISOString() }).eq("id", source.id);
      throw error;
    }
  } catch (error) {
    console.error("Indexing failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ processed: false, error: "Indexing failed." }, { status: 500, headers: corsHeaders });
  }
});
