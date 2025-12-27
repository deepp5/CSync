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
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:5051";

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

// ===============================
// CANONICAL CONVERSATION NORMALIZER
// ===============================
function normalizeConversation(raw) {
  const otherUserId =
    safeString(raw.userId) ||
    safeString(raw.otherUserId) ||
    safeString(raw.partnerId);

  if (!otherUserId) return null;

  const name =
    safeString(raw.name) ||
    safeString(raw.displayName) ||
    safeString(raw.user?.name) ||
    safeString(raw.otherUser?.name) ||
    safeString(raw.username) ||
    `User ${otherUserId.slice(0, 6)}`;

  return {
    userId: otherUserId,
    id: otherUserId,
    name, // ✅ canonical
    username: safeString(raw.username || ""),
    avatar: (name?.[0] || "?").toUpperCase(),
    lastMessage: safeString(raw.lastMessage || ""),
    unread: Number(raw.unread || 0),
    online: Boolean(raw.online),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    timestamp: formatTime(raw.updatedAt || raw.createdAt),
  };
}

/**
 * ✅ Parses your old "attachment in content" format:
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
 * ✅ Normalize any message shape into the UI format
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

const Messages = () => {
  const { user, accessToken, loading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // 🔐 Persist active chat between navigations
  useEffect(() => {
    const saved = sessionStorage.getItem("activeChatId");
    if (saved) setSelectedChatId(saved);
  }, []);

  useEffect(() => {
    if (selectedChatId) sessionStorage.setItem("activeChatId", selectedChatId);
  }, [selectedChatId]);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ refs to avoid stale closures
  const selectedChatIdRef = useRef("");
  const myIdRef = useRef("");

  // ✅ track "last read" per conversation
  const lastReadAtRef = useRef({}); // { [userId]: isoString }

  useEffect(() => {
    selectedChatIdRef.current = safeString(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    myIdRef.current = safeString(user?.id);
  }, [user?.id]);

  // ===============================
  // ✅ SCROLL CONTROL (NO JUMP)
  // ===============================
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

    // first render of this chat -> snap to bottom BEFORE paint
    if (isFirstPaint) {
      el.scrollTop = el.scrollHeight;
      firstPaintRef.current.done = true;
      return;
    }

    // after that -> only stay at bottom if user didn't scroll up
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

  // ===============================
  // FETCH CONVERSATIONS (initial)
  // ===============================
  useEffect(() => {
    if (!accessToken) return;

    const fetchConversations = async () => {
      setError("");

      const cached = prefetchCache.get("messages:conversations");
      if (cached && cached.length > 0) {
        setConversations(cached);
        setSelectedChatId((prev) => prev || cached[0]?.userId || null);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        const formatted = arr
          .map((c) => {
            const otherUserId =
              safeString(c.userId) ||
              safeString(c.otherUserId) ||
              safeString(c.partnerId);

            if (!otherUserId) return null;

            const displayName =
              (safeString(c.username) ? `@${safeString(c.username)}` : "") ||
              safeString(c.name) ||
              `User ${otherUserId.slice(0, 6)}`;

            const legacy = parseLegacyAttachment(safeString(c.lastMessage));
            const preview = legacy
              ? `📎 ${legacy.name}`
              : safeString(c.lastMessage);

            const updatedAt =
              c.updatedAt || c.createdAt || new Date().toISOString();

            return {
              userId: otherUserId,
              name: displayName,
              username: safeString(c.username) || "",
              lastMessage: preview,
              updatedAt,
              online: Boolean(c.online),
              unread: Number(c.unread || 0) || 0,
              timestamp: formatTime(updatedAt),
            };
          })
          .map(normalizeConversation)
          .filter(Boolean)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        setConversations(formatted);
        setSelectedChatId((prev) => prev || formatted[0]?.userId || null);
        prefetchCache.set("messages:conversations", formatted);
      } catch (e) {
        console.error(e);
        setError("Failed to load conversations.");
      }
    };

    fetchConversations();
  }, [accessToken]);

  // ===============================
  // FETCH MESSAGES (CHAT CHANGE)
  // ===============================
  useEffect(() => {
    if (!selectedChatId || !accessToken) return;

    const cached = prefetchCache.get(`messages:thread:${selectedChatId}`);
    if (cached) {
      setMessages(cached);
      // still jump to bottom once on open
      shouldAutoScrollRef.current = true;
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
      return;
    }

    const fetchMessages = async () => {
      setError("");
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
        prefetchCache.set(`messages:thread:${selectedChatId}`, normalized);

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

        shouldAutoScrollRef.current = true;
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        });
      } catch (e) {
        console.error(e);
        setError("Failed to refresh messages.");
      }
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  // ===============================
  // POLL MESSAGES (open chat)
  // ===============================
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
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [accessToken, selectedChatId]);

  // ===============================
  // POLL CONVERSATIONS
  // ===============================
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

          for (const c of arr) {
            const otherId =
              safeString(c.userId) ||
              safeString(c.otherUserId) ||
              safeString(c.partnerId);
            if (!otherId) continue;

            const legacy = parseLegacyAttachment(safeString(c.lastMessage));
            const preview = legacy
              ? `📎 ${legacy.name}`
              : safeString(c.lastMessage);

            const updatedAt =
              c.updatedAt || c.createdAt || new Date().toISOString();
            const old = prevMap.get(otherId);

            const lastRead = lastReadAtRef.current[otherId];
            const hasNew =
              lastRead && !isNaN(new Date(lastRead))
                ? new Date(updatedAt) > new Date(lastRead)
                : false;

            next.push({
              userId: otherId,
              id: otherId,
              // ✅ keep canonical name if we already have it
              name:
                old?.name ||
                (safeString(c.username) ? `@${safeString(c.username)}` : "") ||
                safeString(c.name) ||
                `User ${otherId.slice(0, 6)}`,
              username: safeString(c.username) || old?.username || "",
              avatar:
                old?.avatar ||
                (
                  (safeString(c.username) ? safeString(c.username)[0] : "") ||
                  old?.name?.[0] ||
                  otherId?.[0] ||
                  "?"
                ).toUpperCase(),
              lastMessage: preview,
              updatedAt,
              timestamp: formatTime(updatedAt),
              unread:
                otherId === openId ? 0 : hasNew ? 1 : Number(old?.unread || 0),
              online: Boolean(old?.online),
            });
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

  // ===============================
  // SOCKET CONNECT
  // ===============================
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

      // update conversation row + unread count properly
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
            // ✅ DO NOT overwrite canonical name; keep existing c.name
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: isChatOpen
              ? 0
              : isIncoming
              ? Number(c.unread || 0) + 1
              : Number(c.unread || 0),
          };
        });

        if (!found) {
          const incomingUsername = safeString(message.sender?.username);
          const name = incomingUsername
            ? `@${incomingUsername}`
            : `User ${shortId(otherId)}`;

          updated.unshift({
            userId: otherId,
            id: otherId,
            name,
            username: incomingUsername,
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

      // update messages list only if that chat is open
      if (isChatOpen) {
        setMessages((prev) => {
          if (prev.some((m) => safeString(m.id) === safeString(message.id)))
            return prev;
          const merged = [...prev, message];

          lastReadAtRef.current[safeString(otherId)] =
            merged[merged.length - 1]?.createdAt || new Date().toISOString();

          prefetchCache.set(`messages:thread:${otherId}`, merged);
          return merged;
        });
      } else {
        // still cache for background thread
        const key = `messages:thread:${otherId}`;
        const cached = prefetchCache.get(key) || [];
        prefetchCache.set(key, [...cached, message]);
      }
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

  // ===============================
  // FILTER CONVERSATIONS
  // ===============================
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.username || "").toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.userId === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  // ===============================
  // SEND TEXT MESSAGE (OPTIMISTIC)
  // ===============================
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

    setMessages((prev) => {
      const next = [...prev, optimistic];
      prefetchCache.set(`messages:thread:${selectedChatId}`, next);
      return next;
    });

    setMessageInput("");
    shouldAutoScrollRef.current = true;

    let updatedConversation;
    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === selectedChatId);

      updatedConversation = {
        ...(existing || {}),
        userId: selectedChatId,
        id: selectedChatId,
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

      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? normalizedSaved : m));
        prefetchCache.set(`messages:thread:${selectedChatId}`, next);
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to send message.");
    }
  };

  // ===============================
  // ATTACH
  // ===============================
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

    setMessages((prev) => {
      const next = [...prev, optimistic];
      prefetchCache.set(`messages:thread:${selectedChatId}`, next);
      return next;
    });

    shouldAutoScrollRef.current = true;

    setConversations((prev) =>
      prev.map((c) =>
        c.userId === selectedChatId
          ? {
              ...c,
              lastMessage: `📎 ${file.name}`,
              updatedAt: optimistic.createdAt,
              timestamp: formatTime(optimistic.createdAt),
            }
          : c
      )
    );

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

      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? normalizedSaved : m));
        prefetchCache.set(`messages:thread:${selectedChatId}`, next);
        return next;
      });
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
        {/* LEFT */}
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
                  lastReadAtRef.current[c.userId] = new Date().toISOString();
                  shouldAutoScrollRef.current = true;

                  setConversations((prev) =>
                    prev.map((x) =>
                      x.userId === c.userId ? { ...x, unread: 0 } : x
                    )
                  );

                  requestAnimationFrame(() => {
                    messagesEndRef.current?.scrollIntoView({
                      behavior: "auto",
                    });
                  });
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

        {/* RIGHT */}
        <main className="chat-panel">
          {selectedConversation && selectedChatId ? (
            <>
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

              {/* ✅ SCROLL FIX HERE */}
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
                  <div ref={messagesEndRef} />
                </div>
              </div>

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
