// src/Components/Messages/Messages.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { prefetchCache } from "../../utils/prefetchCache";
import "./Messages.css";
import {
  FiSearch,
  FiMoreVertical,
  FiSend,
  FiPaperclip,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:5051";

// --------------------
// Helpers
// --------------------
function safeString(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function shortId(id) {
  if (!id) return "";
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

/**
 * Parses old "attachment in content" format:
 * "📎 filename\nhttps://..."
 */
function parseLegacyAttachment(content = "") {
  if (!content.startsWith("📎")) return null;
  const [firstLine, ...rest] = content.split("\n");
  const name = firstLine.replace("📎", "").trim();
  const url = rest.join("\n").trim();
  if (!name) return null;
  if (!url.startsWith("http")) return null;
  return { name, url };
}

/**
 * Normalize any message shape into the UI format
 */
function normalizeMessage(raw, fallbackId = "") {
  const content = safeString(raw?.content);
  const legacy = parseLegacyAttachment(content);

  const type = raw?.type || (legacy ? "file" : "text");

  const fileName =
    raw?.fileName ||
    raw?.attachment?.name ||
    raw?.attachmentName ||
    (legacy ? legacy.name : null);

  const fileUrl =
    raw?.fileUrl ||
    raw?.attachment?.url ||
    raw?.attachmentUrl ||
    (legacy ? legacy.url : null);

  return {
    id: raw?.id ?? fallbackId,
    senderId: safeString(raw?.senderId),
    receiverId: safeString(raw?.receiverId),
    content,
    createdAt: raw?.createdAt || new Date().toISOString(),
    read: Boolean(raw?.read),
    type,
    fileName,
    fileUrl,
    sender: raw?.sender || null,
  };
}

/**
 * Canonical conversation normalization (UI-safe)
 */
function normalizeConversation(raw, prevMap) {
  const otherUserId =
    safeString(raw?.userId) ||
    safeString(raw?.otherUserId) ||
    safeString(raw?.partnerId);

  if (!otherUserId) return null;

  const old = prevMap?.get(otherUserId);

  const username = safeString(raw?.username) || safeString(old?.username) || "";

  const displayName =
    (username ? `@${username}` : "") ||
    safeString(raw?.name) ||
    safeString(raw?.displayName) ||
    safeString(raw?.user?.name) ||
    safeString(raw?.otherUser?.name) ||
    safeString(old?.name) ||
    `User ${otherUserId.slice(0, 6)}`;

  const legacy = parseLegacyAttachment(safeString(raw?.lastMessage));
  const preview = legacy ? `📎 ${legacy.name}` : safeString(raw?.lastMessage);

  const updatedAt =
    raw?.updatedAt ||
    raw?.createdAt ||
    old?.updatedAt ||
    new Date().toISOString();

  return {
    userId: otherUserId,
    id: otherUserId,
    name: displayName,
    username,
    avatar:
      safeString(old?.avatar) ||
      (displayName?.[0] || otherUserId?.[0] || "?").toUpperCase(),
    lastMessage: preview || safeString(old?.lastMessage) || "",
    unread: Number(old?.unread || raw?.unread || 0),
    online: Boolean(raw?.online ?? old?.online),
    updatedAt,
    timestamp: formatTime(updatedAt),
  };
}

const Messages = () => {
  const { user, accessToken, loading } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Persist active chat between navigations
  useEffect(() => {
    const saved = sessionStorage.getItem("activeChatId");
    if (saved) setSelectedChatId(saved);
  }, []);

  useEffect(() => {
    if (selectedChatId) sessionStorage.setItem("activeChatId", selectedChatId);
  }, [selectedChatId]);

  // Backward compat: if someone navigates /messages?user=ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const u = safeString(params.get("user"));
    if (!u) return;

    sessionStorage.setItem("activeChatId", u);
    setSelectedChatId(u);
  }, [location.search]);

  // refs to avoid stale closures
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedChatIdRef = useRef("");
  const myIdRef = useRef("");

  // unread tracking: last read timestamp per conversation
  const lastReadAtRef = useRef({}); // { [userId]: isoString }

  useEffect(() => {
    selectedChatIdRef.current = safeString(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    myIdRef.current = safeString(user?.id);
  }, [user?.id]);

  // --------------------
  // Scroll control (NO JUMP)
  // --------------------
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const firstPaintRef = useRef({ chatId: null, done: false });

  useEffect(() => {
    if (!selectedChatId) return;
    firstPaintRef.current = { chatId: selectedChatId, done: false };
    shouldAutoScrollRef.current = true;
  }, [selectedChatId]);

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !selectedChatId) return;

    const isFirstPaint =
      firstPaintRef.current.chatId === selectedChatId &&
      !firstPaintRef.current.done;

    if (isFirstPaint) {
      el.scrollTop = el.scrollHeight;
      firstPaintRef.current.done = true;
      return;
    }

    if (shouldAutoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, selectedChatId]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const threshold = 80;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < threshold;
  };

  // --------------------
  // Fetch conversations (cache first, then refresh)
  // --------------------
  useEffect(() => {
    if (!accessToken) return;

    const fetchConversations = async () => {
      setError("");

      const cached = prefetchCache.get("messages:conversations");
      if (cached && cached.length > 0) {
        setConversations(cached);
        setSelectedChatId((prev) => prev || cached[0]?.userId || null);
      }

      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        setConversations((prev) => {
          const prevMap = new Map(prev.map((c) => [c.userId, c]));
          const formatted = arr
            .map((c) => normalizeConversation(c, prevMap))
            .filter(Boolean);

          // ✅ preserve placeholder conversation (new user) if not yet in API
          const openId = safeString(selectedChatIdRef.current);
          if (openId && prevMap.has(openId)) {
            const alreadyIn = formatted.some(
              (x) => safeString(x.userId) === openId
            );
            if (!alreadyIn) formatted.push(prevMap.get(openId));
          }

          formatted.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          prefetchCache.set("messages:conversations", formatted);
          return formatted;
        });
      } catch (e) {
        console.error(e);
        if (!cached || cached.length === 0)
          setError("Failed to load conversations.");
      }
    };

    fetchConversations();
  }, [accessToken]);

  // --------------------
  // Create placeholder conversation if user clicked Message from profile/post
  // --------------------
  useEffect(() => {
    if (!selectedChatId) return;

    const exists = conversations.some(
      (c) => safeString(c.userId) === safeString(selectedChatId)
    );
    if (exists) return;

    let meta = {};
    try {
      meta = JSON.parse(sessionStorage.getItem("activeChatMeta") || "{}");
    } catch {}

    const username = safeString(meta.username);
    const name =
      (username ? `@${username}` : "") ||
      safeString(meta.name) ||
      `User ${shortId(selectedChatId)}`;

    const nowIso = new Date().toISOString();

    setConversations((prev) => {
      if (prev.some((c) => safeString(c.userId) === safeString(selectedChatId)))
        return prev;

      const placeholder = {
        userId: safeString(selectedChatId),
        id: safeString(selectedChatId),
        name,
        username,
        avatar: (name?.[0] || "?").toUpperCase(),
        lastMessage: "",
        unread: 0,
        online: false,
        updatedAt: nowIso,
        timestamp: formatTime(nowIso),
      };

      const next = [placeholder, ...prev];
      prefetchCache.set("messages:conversations", next);
      return next;
    });
  }, [selectedChatId, conversations]);

  // --------------------
  // Fetch messages on chat change (cache first)
  // --------------------
  useEffect(() => {
    if (!selectedChatId || !accessToken) return;

    setError("");

    const cacheKey = `messages:thread:${selectedChatId}`;
    const cached = prefetchCache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      setMessages(cached);

      const lastTime =
        cached.length > 0
          ? cached[cached.length - 1]?.createdAt
          : new Date().toISOString();
      lastReadAtRef.current[safeString(selectedChatId)] = lastTime;

      setConversations((prev) =>
        prev.map((c) => (c.userId === selectedChatId ? { ...c, unread: 0 } : c))
      );
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/${selectedChatId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((m, idx) =>
          normalizeMessage(m, m.id ?? `${m.createdAt || Date.now()}-${idx}`)
        );

        setMessages(normalized);
        prefetchCache.set(cacheKey, normalized);

        const lastTime =
          normalized.length > 0
            ? normalized[normalized.length - 1].createdAt
            : new Date().toISOString();
        lastReadAtRef.current[safeString(selectedChatId)] = lastTime;

        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedChatId ? { ...c, unread: 0 } : c
          )
        );
      } catch (e) {
        console.error(e);
        if (!cached) setError("Failed to load messages.");
      }
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  // --------------------
  // POLL: open chat messages (no refresh needed)
  // --------------------
  useEffect(() => {
    if (!accessToken || !selectedChatId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/${selectedChatId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((m, idx) =>
          normalizeMessage(m, m.id ?? `${m.createdAt || Date.now()}-${idx}`)
        );

        setMessages((prev) => {
          const ids = new Set(prev.map((x) => safeString(x.id)));
          const merged = [...prev];
          let added = 0;

          for (const m of normalized) {
            const id = safeString(m.id);
            if (!ids.has(id)) {
              merged.push(m);
              added++;
            }
          }

          if (added > 0) {
            const lastTime = merged[merged.length - 1]?.createdAt;
            if (lastTime)
              lastReadAtRef.current[safeString(selectedChatId)] = lastTime;
            prefetchCache.set(`messages:thread:${selectedChatId}`, merged);
          }

          return merged;
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedChatId ? { ...c, unread: 0 } : c
          )
        );
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [accessToken, selectedChatId]);

  // --------------------
  // POLL: conversations list + unread badge = 1
  // --------------------
  useEffect(() => {
    if (!accessToken) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        const openId = safeString(selectedChatIdRef.current);

        setConversations((prev) => {
          const prevMap = new Map(prev.map((c) => [c.userId, c]));
          const next = [];

          for (const raw of arr) {
            const conv = normalizeConversation(raw, prevMap);
            if (!conv) continue;

            const otherId = conv.userId;
            const lastRead = lastReadAtRef.current[otherId];

            const hasNew =
              lastRead && !isNaN(new Date(lastRead))
                ? new Date(conv.updatedAt) > new Date(lastRead)
                : false;

            const unread = otherId === openId ? 0 : hasNew ? 1 : 0;
            next.push({ ...conv, unread });
          }

          // ✅ preserve placeholder/new convo if not yet returned by API
          if (openId && prevMap.has(openId)) {
            const alreadyIn = next.some((x) => safeString(x.userId) === openId);
            if (!alreadyIn) next.push(prevMap.get(openId));
          }

          next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          prefetchCache.set("messages:conversations", next);
          return next;
        });
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // --------------------
  // SOCKET: realtime fast path
  // --------------------
  useEffect(() => {
    if (!accessToken) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(API_BASE, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    const onConnect = () => console.log("🟢 socket connected:", socket.id);
    const onConnectError = (e) =>
      console.log("🔴 socket connect_error:", e.message);

    const onNewMessage = (raw) => {
      const myId = safeString(myIdRef.current);
      if (!myId) return;

      const message = normalizeMessage(raw, raw?.id ?? `socket-${Date.now()}`);

      const senderId = safeString(message.senderId);
      const receiverId = safeString(message.receiverId);
      const otherId = senderId === myId ? receiverId : senderId;

      const openChatId = safeString(selectedChatIdRef.current);
      const isChatOpen = openChatId === safeString(otherId);
      const isIncoming = senderId !== myId;

      // cache thread
      const threadKey = `messages:thread:${otherId}`;
      const cachedThread = prefetchCache.get(threadKey) || [];
      if (
        !cachedThread.some((m) => safeString(m.id) === safeString(message.id))
      ) {
        prefetchCache.set(threadKey, [...cachedThread, message]);
      }

      setConversations((prev) => {
        const preview =
          message.type === "file"
            ? `📎 ${message.fileName || "Attachment"}`
            : safeString(message.content);

        let found = false;
        const updated = prev.map((c) => {
          if (c.userId !== otherId) return c;
          found = true;
          return {
            ...c,
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: isChatOpen ? 0 : isIncoming ? 1 : Number(c.unread || 0),
          };
        });

        if (!found) {
          const username = safeString(message.sender?.username);
          const name = username ? `@${username}` : `User ${shortId(otherId)}`;

          updated.unshift({
            userId: otherId,
            id: otherId,
            name,
            username,
            avatar: (name?.[0] || otherId?.[0] || "?").toUpperCase(),
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: isChatOpen ? 0 : isIncoming ? 1 : 0,
            online: false,
          });
        }

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        prefetchCache.set("messages:conversations", updated);
        return updated;
      });

      if (!isChatOpen) return;

      setMessages((prev) => {
        if (prev.some((m) => safeString(m.id) === safeString(message.id)))
          return prev;
        const merged = [...prev, message];

        const lastTime =
          merged[merged.length - 1]?.createdAt || new Date().toISOString();
        lastReadAtRef.current[safeString(otherId)] = lastTime;

        prefetchCache.set(`messages:thread:${otherId}`, merged);
        return merged;
      });
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("new_message", onNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  // --------------------
  // Derived
  // --------------------
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.userId === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  // --------------------
  // Send text (optimistic)
  // --------------------
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError("");

    const text = messageInput.trim();
    if (!text || !selectedChatId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = normalizeMessage(
      {
        id: tempId,
        senderId: safeString(user?.id),
        receiverId: safeString(selectedChatId),
        content: text,
        createdAt: new Date().toISOString(),
        read: false,
        type: "text",
      },
      tempId
    );

    shouldAutoScrollRef.current = true;
    setMessages((prev) => [...prev, optimistic]);

    const threadKey = `messages:thread:${selectedChatId}`;
    prefetchCache.set(threadKey, [
      ...(prefetchCache.get(threadKey) || []),
      optimistic,
    ]);

    lastReadAtRef.current[safeString(selectedChatId)] = optimistic.createdAt;
    setMessageInput("");

    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === selectedChatId);

      const updatedConversation = {
        ...(existing || {}),
        userId: selectedChatId,
        id: selectedChatId,
        name: existing?.name || `User ${shortId(selectedChatId)}`,
        username: existing?.username || "",
        avatar: existing?.avatar || (selectedChatId?.[0] || "?").toUpperCase(),
        lastMessage: text,
        updatedAt: optimistic.createdAt,
        timestamp: formatTime(optimistic.createdAt),
        unread: 0,
        online: existing?.online || false,
      };

      const next = [
        updatedConversation,
        ...prev.filter((c) => c.userId !== selectedChatId),
      ];
      prefetchCache.set("messages:conversations", next);
      return next;
    });

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ receiverId: selectedChatId, content: text }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /messages failed ${res.status}: ${txt}`);
      }

      const saved = await res.json();
      const normalizedSaved = normalizeMessage(saved, saved?.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? normalizedSaved : m))
      );

      prefetchCache.set(
        threadKey,
        (prefetchCache.get(threadKey) || []).map((m) =>
          m.id === tempId ? normalizedSaved : m
        )
      );

      lastReadAtRef.current[safeString(selectedChatId)] =
        normalizedSaved.createdAt || new Date().toISOString();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to send message.");
    }
  };

  // --------------------
  // Attach / upload file (optimistic)
  // --------------------
  const handleAttachClick = () => {
    if (!selectedChatId || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedChatId) return;

    setUploading(true);
    setError("");

    const tempId = `temp-file-${Date.now()}`;
    const optimistic = normalizeMessage(
      {
        id: tempId,
        senderId: safeString(user?.id),
        receiverId: safeString(selectedChatId),
        content: `📎 ${file.name}`,
        createdAt: new Date().toISOString(),
        read: false,
        type: "file",
        fileName: file.name,
        fileUrl: null,
      },
      tempId
    );

    shouldAutoScrollRef.current = true;
    setMessages((prev) => [...prev, optimistic]);

    const threadKey = `messages:thread:${selectedChatId}`;
    prefetchCache.set(threadKey, [
      ...(prefetchCache.get(threadKey) || []),
      optimistic,
    ]);

    lastReadAtRef.current[safeString(selectedChatId)] = optimistic.createdAt;

    setConversations((prev) => {
      const next = prev.map((c) =>
        c.userId === selectedChatId
          ? {
              ...c,
              lastMessage: `📎 ${file.name}`,
              updatedAt: optimistic.createdAt,
              timestamp: formatTime(optimistic.createdAt),
              unread: 0,
            }
          : c
      );
      prefetchCache.set("messages:conversations", next);
      return next;
    });

    try {
      const form = new FormData();
      form.append("receiverId", selectedChatId);
      form.append("file", file);

      const res = await fetch(`${API_BASE}/messages/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /messages/upload failed ${res.status}: ${txt}`);
      }

      const payload = await res.json();
      const normalizedSaved = normalizeMessage(
        {
          ...(payload?.message || {}),
          type: "file",
          fileName: payload?.attachment?.name || payload?.message?.fileName,
          fileUrl: payload?.attachment?.url || payload?.message?.fileUrl,
        },
        payload?.message?.id
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? normalizedSaved : m))
      );

      prefetchCache.set(
        threadKey,
        (prefetchCache.get(threadKey) || []).map((m) =>
          m.id === tempId ? normalizedSaved : m
        )
      );

      lastReadAtRef.current[safeString(selectedChatId)] =
        normalizedSaved.createdAt || new Date().toISOString();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="messaging-page">
      <div className="messaging-bg" aria-hidden="true" />

      <div className="messaging-shell">
        {/* LEFT / CONVERSATIONS */}
        <aside className="conversations-panel">
          <div className="left-top">
            <div className="left-title-row">
              <div>
                <h2 className="left-title">Messages</h2>
                <p className="left-subtitle">
                  Find a conversation, then ship faster.
                </p>
              </div>

              <div className="left-chip">
                <span className="left-chip-dot" />
                Live
              </div>
            </div>

            <div className="left-search">
              <FiSearch className="left-search-icon" />
              <input
                className="left-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-list">
            {filteredConversations.map((c) => (
              <button
                key={c.userId}
                type="button"
                className={`conv-row ${
                  selectedChatId === c.userId ? "is-active" : ""
                }`}
                onClick={() => {
                  setSelectedChatId(c.userId);
                  shouldAutoScrollRef.current = true;

                  lastReadAtRef.current[c.userId] = new Date().toISOString();

                  setConversations((prev) =>
                    prev.map((x) =>
                      x.userId === c.userId ? { ...x, unread: 0 } : x
                    )
                  );
                }}
              >
                <div className="conv-avatar-wrap">
                  <div className="conv-avatar">{c.avatar}</div>
                  {c.online && <div className="conv-online" />}
                </div>

                <div className="conv-meta">
                  <div className="conv-topline">
                    <span className="conv-name">{c.name}</span>
                    <span className="conv-time">{c.timestamp}</span>
                  </div>

                  <div className="conv-bottomline">
                    <span className="conv-preview">{c.lastMessage || " "}</span>
                    {c.unread > 0 && (
                      <span className="conv-badge">{c.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <div className="left-empty">No conversations found</div>
            )}
          </div>

          {error && <div className="left-error">{error}</div>}
        </aside>

        {/* RIGHT / CHAT */}
        <main className="chat-panel">
          {selectedConversation && selectedChatId ? (
            <>
              {/* header */}
              <div className="chat-header">
                <Link
                  to={`/profile/${
                    selectedConversation?.username ||
                    selectedConversation?.userId
                  }`}
                  className="chat-head-left chat-head-link"
                >
                  <div className="chat-head-avatar-wrap">
                    <div className="chat-head-avatar">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <div className="chat-head-online" />
                    )}
                  </div>

                  <div className="chat-head-text">
                    <h3 className="chat-head-name">
                      {selectedConversation.name}
                    </h3>
                    <p className="chat-head-status">
                      {selectedConversation.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </Link>

                <button
                  className="chat-more-btn"
                  type="button"
                  aria-label="More"
                  title="More"
                >
                  <FiMoreVertical />
                </button>
              </div>

              {/* messages */}
              <div
                className="messages-container"
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
              >
                <div className="messages-list">
                  {messages.map((m) => {
                    const isOwn =
                      safeString(m.senderId) === safeString(user?.id);
                    const isFile = m.type === "file";

                    return (
                      <div
                        key={m.id}
                        className={`msg-row ${isOwn ? "own" : "other"}`}
                      >
                        {!isOwn && (
                          <div className="msg-avatar">
                            {selectedConversation.avatar}
                          </div>
                        )}

                        <div
                          className={`msg-bubble ${isOwn ? "own" : "other"}`}
                        >
                          {isFile ? (
                            <p className="msg-text">
                              📎{" "}
                              {m.fileUrl ? (
                                <a
                                  href={m.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="msg-link"
                                >
                                  {m.fileName || "Attachment"}
                                </a>
                              ) : (
                                m.fileName || "Attachment"
                              )}
                            </p>
                          ) : (
                            <p className="msg-text">{safeString(m.content)}</p>
                          )}

                          <div className="msg-footer">
                            <span className="msg-time">
                              {formatTime(m.createdAt)}
                            </span>
                            {isOwn && (
                              <span className="msg-status">
                                {m.read ? (
                                  <FiCheckCircle className="msg-read" />
                                ) : (
                                  <FiCheck className="msg-sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* input */}
              <div className="composer">
                <button
                  className="composer-icon"
                  type="button"
                  aria-label="Attach"
                  onClick={handleAttachClick}
                  disabled={!selectedChatId || uploading}
                  title={uploading ? "Uploading..." : "Attach file"}
                >
                  <FiPaperclip />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileSelected}
                />

                <form onSubmit={handleSendMessage} className="composer-form">
                  <input
                    className="composer-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      uploading ? "Uploading..." : "Type a message..."
                    }
                    disabled={uploading}
                  />

                  <button
                    className="composer-send"
                    type="submit"
                    disabled={!messageInput.trim() || uploading}
                    aria-label="Send"
                    title="Send"
                  >
                    <FiSend />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-card">
                <div className="empty-orb" />
                <div className="empty-emoji">💬</div>
                <h3 className="empty-title">Select a conversation</h3>
                <p className="empty-text">
                  Choose someone on the left to start messaging.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages;
