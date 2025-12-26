import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";

const API_BASE = "http://localhost:5051";
let inFlight = null;

export async function prefetchSettings() {
  if (prefetchCache.get("settings")) return;
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
      });

      if (!res.ok) return;

      const dataJson = await res.json();

      prefetchCache.set("settings", {
        displayName: dataJson.name || "",
        username: dataJson.username || "",
        email: dataJson.email || "",
        profileVisibility: dataJson.profileVisibility || "FOLLOWERS",
        showEmail: !!dataJson.showEmail,
        allowMessages: !!dataJson.allowMessages,
      });
    } catch (e) {
      console.error("prefetchSettings failed:", e);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}