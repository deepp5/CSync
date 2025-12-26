import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { prefetchHomeFeed } from "../utils/prefetchHomeFeed";
import { prefetchProfile } from "../utils/prefetchProfile";
import { prefetchCache } from "../utils/prefetchCache";
import { prefetchSettings } from "../utils/prefetchSettings.js";

const API_BASE = "http://localhost:5051";

async function prefetchMessagesOnLogin(session) {
  try {
    const token = session?.access_token;
    if (!token) return;

    // Fetch conversations
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const conversations = await res.json();
    if (!Array.isArray(conversations) || conversations.length === 0) return;

    // Normalize conversations (same shape Messages.jsx expects)
    const normalized = conversations
      .map((c) => {
        const otherUserId = String(
          c.userId || c.otherUserId || c.partnerId || c.user_id || ""
        );
        if (!otherUserId) return null;

        const name =
          c.name ||
          c.user?.name ||
          c.otherUser?.name ||
          `User ${otherUserId.slice(0, 6)}`;

        const username =
          c.username ||
          c.user?.username ||
          c.otherUser?.username ||
          "";

        return {
          id: otherUserId,
          userId: otherUserId,
          name,
          username,
          avatar: (name[0] || "U").toUpperCase(),
          lastMessage: c.lastMessage || "",
          unread: Number(c.unread || 0),
          online: false,
          createdAt: c.updatedAt || c.createdAt || new Date().toISOString(),
        };
      })
      .filter(Boolean);

    // Cache conversations list
    prefetchCache.set("messages:conversations", normalized);

    // Prefetch ALL message threads so Messages page is instant on first open
    await Promise.all(
      normalized.map(async (conv) => {
        const uid = conv.userId;
        if (!uid) return;

        const msgRes = await fetch(`${API_BASE}/messages/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!msgRes.ok) return;

        const msgs = await msgRes.json();
        if (Array.isArray(msgs)) {
          prefetchCache.set(`messages:thread:${uid}`, msgs);
        }
      })
    );
  } catch (e) {
    console.error("prefetchMessagesOnLogin failed:", e);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const prefetchAfterLogin = async (session) => {
    if (!session?.user) return;

    const username =
      session.user.user_metadata?.username ||
      session.user.email?.split("@")[0];

    prefetchHomeFeed();
    if (username) prefetchProfile(username);
    prefetchSettings();

    prefetchMessagesOnLogin(session);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);

      prefetchAfterLogin(data.session);

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      prefetchAfterLogin(session);
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
