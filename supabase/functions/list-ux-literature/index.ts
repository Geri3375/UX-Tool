import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const bucket = "UX Literature";

function titleFromPath(path: string) {
  const filename = path.split("/").at(-1) ?? path;
  return filename.replace(/\.[^.]+$/, "").replaceAll("_", " ").trim();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Storage service is not configured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.storage.from(bucket).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    return Response.json({ error: "Unable to list literature" }, { status: 502 });
  }

  const documents = data
    .filter((object) => object.id && object.metadata)
    .map((object) => {
      const { data: publicData } = admin.storage.from(bucket).getPublicUrl(object.name);

      return {
        id: object.id,
        title: titleFromPath(object.name),
        storagePath: object.name,
        sizeBytes: Number(object.metadata?.size ?? 0),
        mimeType: typeof object.metadata?.mimetype === "string" ? object.metadata.mimetype : null,
        updatedAt: object.updated_at ?? object.created_at,
        publicUrl: publicData.publicUrl,
      };
    });

  return Response.json(
    { documents },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
});
