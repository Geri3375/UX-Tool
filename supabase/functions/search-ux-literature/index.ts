import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const corsHeaders = { "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Origin": "*" };

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  try {
    const body = await request.json() as { query?: unknown };
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2 || query.length > 200) return Response.json({ error: "Enter a search query between 2 and 200 characters." }, { status: 400, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase.rpc("search_library_pages", { query_text: query, result_limit: 24 });
    if (error) throw error;
    const results = (data ?? []).map((row) => ({ sourceId: row.source_id, title: row.title, storagePath: row.storage_path, pdfPageNumber: row.pdf_page_number, printedPageLabel: row.printed_page_label, sectionTitle: row.section_title, excerpt: row.excerpt, rank: row.rank }));
    return Response.json({ query, results }, { headers: { ...corsHeaders, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Search failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The library search is temporarily unavailable." }, { status: 500, headers: corsHeaders });
  }
});
