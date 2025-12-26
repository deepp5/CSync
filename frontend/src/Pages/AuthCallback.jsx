import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { prefetchHomeFeed } from "../utils/prefetchHomeFeed";

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // 🚀 Prefetch home feed for instant Home load
      prefetchHomeFeed();

      // Check if user has username set in metadata
      const username = user.user_metadata?.username;

      if (!username) {
        // Go to setup page first
        window.location.href = "/setup";
      } else {
        // Already set → send to home
        window.location.href = "/home";
      }
    };

    handleAuth();
  }, []);

  return <p>Loading...</p>;
}
