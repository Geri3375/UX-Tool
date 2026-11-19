import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishableKey) throw new Error("Public Supabase configuration is required.");

const supabase = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });

for (let attempt = 1; attempt <= 50; attempt += 1) {
  const { data, error } = await supabase.functions.invoke("index-ux-literature", { body: {} });
  if (error) throw error;
  console.log(data.message);
  if (!data.processed) break;
}
