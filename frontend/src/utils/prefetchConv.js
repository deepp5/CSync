import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";
import { API_BASE_URL } from "../api";
const API_BASE = `${API_BASE_URL}`;

// Single in-flight promise to avoid duplicate fetches
let inFlight = null;

/**
 * Canonical conversation normalizer
 * This MUST be the single source of truth for names/usernames
 */
function normalizeConversation(raw) {
  const otherUserId = String(
    raw.userId || raw.otherUserId || raw.partnerId || raw.user_id || ""
  );
  if (!otherUserId) return null;

  const name =
    raw.name ||
    raw.displayName ||
    raw.user?.name ||
    raw.otherUser?.name ||
    raw.username ||
    `User ${otherUserId.slice(0, 6)}`;

  const updatedAt =
    raw.updatedAt || raw.createdAt || raw.lastMessageAt || new Date().toISOString();

  return {
    id: otherUserId,
    userId: otherUserId,
    name, // ✅ CANONICAL — NEVER mutate later
    avatar: (name[0] || "U").toUpperCase(),
    lastMessage: raw.lastMessage || "",
    unread: Number(raw.unread || 0),
    online: false,
    updatedAt,
    timestamp: new Date(updatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * Prefetch ALL conversations + ALL message threads on login
 * Guarantees Messages.jsx is instant with ZERO flicker
 */
export async function prefetchConversations() {
  if (prefetchCache.get("messages:conversations")) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) return;

      const token = session.access_token;

      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) return;

      // ✅ Normalize ONCE — canonical
      const conversations = raw
        .map(normalizeConversation)
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // Cache conversation list
      prefetchCache.set("messages:conversations", conversations);

      // Prefetch ALL message threads so chat pane is instant
      await Promise.all(
        conversations.map(async (c) => {
          const uid = c.userId;
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
    } catch (err) {
      console.error("prefetchConversations failed:", err);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}