import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("Supabase admin client cannot run in the browser");
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is not defined");
}

if (!SERVICE_ROLE) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY environment variable is not defined"
  );
}

// Prevent multiple instances in dev (hot reload safe)
if (!global.supabaseAdmin) {
  global.supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  console.log("✅ Supabase Admin initialized");
}

export const getSupabaseAdmin = () => global.supabaseAdmin;
