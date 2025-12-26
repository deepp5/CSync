import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { prefetchHomeFeed } from "../utils/prefetchHomeFeed";
import { prefetchProfile } from "../utils/prefetchProfile";
import { prefetchMessagesWith } from "../utils/prefetchMsg";
import { prefetchCache } from "../utils/prefetchCache";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        const username =
          data.session.user.user_metadata?.username ||
          data.session.user.email?.split("@")[0];

        // Fire-and-forget prefetches
        prefetchHomeFeed();
        if (username) prefetchProfile(username);

        (async () => {
          try {
            const token = data.session?.access_token;
            if (!token) return;

            const res = await fetch("http://localhost:5051/conversations", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;

            const conversations = await res.json();
            prefetchCache.set("conversations", conversations);

            conversations.slice(0, 3).forEach((c) => {
              const otherUserId =
                c.userId || c.otherUserId || c.partnerId || c.user_id;
              if (otherUserId) {
                prefetchMessagesWith(otherUserId);
              }
            });
          } catch (e) {
            console.error("AuthContext message prefetch failed:", e);
          }
        })();
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const username =
          session.user.user_metadata?.username ||
          session.user.email?.split("@")[0];

        prefetchHomeFeed();
        if (username) prefetchProfile(username);

        (async () => {
          try {
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch("http://localhost:5051/conversations", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;

            const conversations = await res.json();
            prefetchCache.set("conversations", conversations);

            conversations.slice(0, 3).forEach((c) => {
              const otherUserId =
                c.userId || c.otherUserId || c.partnerId || c.user_id;
              if (otherUserId) {
                prefetchMessagesWith(otherUserId);
              }
            });
          } catch (e) {
            console.error("AuthContext message prefetch failed:", e);
          }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accessToken: session?.access_token || null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}
