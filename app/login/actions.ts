"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requestSignIn(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
    redirect("/login?error=invalid_email");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const callbackOrigin = configuredSiteUrl ?? origin;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callbackOrigin ? `${callbackOrigin}/auth/callback` : undefined,
    },
  });

  if (error) {
    redirect("/login?error=sign_in_failed");
  }

  redirect("/login?status=check_email");
}
