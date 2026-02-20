import { createClient } from "@supabase/supabase-js";

let supabaseAdmin;

export function getSupabaseAdmin() {
  // Prevent client-side usage
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client must run on server only");
  }

  if (supabaseAdmin) return supabaseAdmin;

  const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!SERVICE_ROLE) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  console.log("✅ Supabase Admin initialized");

  return supabaseAdmin;
}
