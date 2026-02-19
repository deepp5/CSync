// src/utils/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not set");
  }

  if (!SERVICE_ROLE) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseAdmin;
}
