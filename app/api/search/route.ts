import { NextRequest } from "next/server";

import type { SearchResponse } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2 || query.length > 200) {
    return Response.json(
      { error: "Enter a search query between 2 and 200 characters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<SearchResponse>("search-ux-literature", {
    body: { query },
  });

  if (error) {
    console.error("Library search failed", { code: error.code });
    return Response.json({ error: "The library search is temporarily unavailable." }, { status: 500 });
  }

  return Response.json(data ?? { query, results: [] }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
