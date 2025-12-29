import { prefetchCache } from "./prefetchCache";
import { supabase } from "../supabaseClient";

const API_BASE = "http://localhost:5051";
const inFlight = new Map();

export async function prefetchMessagesWith(userId) {
  const key = `messages:thread:${userId}`;

  // already cached
  if (prefetchCache.get(key)) return;

  // already fetching
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return;

      const token = data.session.access_token;

      const res = await fetch(`${API_BASE}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const dataJson = await res.json();
      if (Array.isArray(dataJson)) {
        prefetchCache.set(key, dataJson);
      }
    } catch (e) {
      console.error("prefetchMessages error:", e);
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}