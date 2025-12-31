import axios from "axios";
import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";
import { API_BASE_URL } from "../api";

const API_BASE = API_BASE_URL;

let homePromise = null;

export async function prefetchHome() {
  if (homePromise) return homePromise;
  if (prefetchCache.get("homeFeed")) return;

  homePromise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await axios.get(`${API_BASE}/posts`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      prefetchCache.set("homeFeed", res.data);
    } catch (e) {
      console.error("Home prefetch error:", e);
    } finally {
      setTimeout(() => (homePromise = null), 100);
    }
  })();

  return homePromise;
}
