import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";

const API_BASE = "http://localhost:5051";

// single in-flight promise to dedupe
let inFlight = null;

/**
 * Canonical settings prefetch
 * - Always normalizes shape
 * - Never leaves undefined fields
 * - Safe to read synchronously in Settings.jsx
 */
export async function prefetchSettings() {
  // already cached
  if (prefetchCache.get("settings")) return;

  // already fetching
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) return;

      const res = await fetch(`${API_BASE}/settings`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) return;

      const raw = await res.json();

      // ✅ canonical, fully-defined shape (NO undefined)
      const normalized = {
        displayName: raw?.name ?? "",
        username: raw?.username ?? "",
        email: raw?.email ?? "",
        profileVisibility: raw?.profileVisibility ?? "FOLLOWERS",
        showEmail: Boolean(raw?.showEmail),
        allowMessages: Boolean(raw?.allowMessages),
      };

      prefetchCache.set("settings", normalized);
    } catch (e) {
      console.error("prefetchSettings failed:", e);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}