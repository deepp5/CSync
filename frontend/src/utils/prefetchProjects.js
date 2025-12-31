import axios from "axios";
import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";
import { API_BASE_URL } from "../api";

const API_BASE = API_BASE_URL;

let prefetchPromise = null;

export async function prefetchMyProjects() {
  // If already prefetching, return the existing promise
  if (prefetchPromise) {
    return prefetchPromise;
  }

  // If already cached, no need to prefetch
  if (prefetchCache.get("myProjects")) {
    return;
  }

  prefetchPromise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const res = await axios.get(`${API_BASE}/posts/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      prefetchCache.set("myProjects", res.data);
    } catch (error) {
      console.error("Prefetch error:", error);
    } finally {
      // Reset promise after 100ms so it can be called again
      setTimeout(() => {
        prefetchPromise = null;
      }, 100);
    }
  })();

  return prefetchPromise;
}