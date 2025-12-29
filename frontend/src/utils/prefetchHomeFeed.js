// utils/prefetchHomeFeed.js
import axios from "axios";
import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";

let prefetchPromise = null;

export async function prefetchHomeFeed() {
  if (prefetchPromise) return prefetchPromise;
  if (prefetchCache.get("homeFeed")) return;

  prefetchPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await axios.get("http://localhost:5051/posts", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      prefetchCache.set("homeFeed", res.data);
    } catch (e) {
      console.error("Home prefetch failed:", e);
    } finally {
      setTimeout(() => (prefetchPromise = null), 100);
    }
  })();

  return prefetchPromise;
}