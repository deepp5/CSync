// src/Components/Messages/Messages.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Messages.css";
import {
  FiSearch,
  FiMoreVertical,
  FiSend,
  FiPaperclip,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
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

  // ✅ track "last read" per conversation (to show unread = 1)
  const lastReadAtRef = useRef({}); // { [userId]: isoString }

  useEffect(() => {
    selectedChatIdRef.current = safeString(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    myIdRef.current = safeString(user?.id);
  }, [user?.id]);

  // ===============================
  // ✅ SCROLL ISSUE FIX (ONLY ADDITION)
  // ===============================
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const threshold = 80; // px near bottom counts as "at bottom"
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
              avatar: (
                displayName?.[0] ||
                otherUserId?.[0] ||
                "?"
              ).toUpperCase(),
              lastMessage: preview,
              updatedAt,
              timestamp: formatTime(updatedAt),
              unread: 0,
              online: Boolean(c.online),
            };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        setConversations(formatted);
        setSelectedChatId((prev) => prev || formatted[0]?.userId || null);
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

        // ✅ mark as read (client-side)
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

        // ✅ when you open a chat, jump to bottom once
        shouldAutoScrollRef.current = true;
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        });
      } catch (e) {
        console.error(e);
        setMessages([]);
        setError("Failed to load messages.");
      }
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  // ===============================
  // AUTO SCROLL (FIXED: ONLY IF USER IS NEAR BOTTOM)
  // ===============================
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===============================
  // ✅ POLL MESSAGES for open chat (fix: no refresh needed)
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

        // merge new messages only (avoid re-setting whole list)
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
          }

          return merged;
        });
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [accessToken, selectedChatId]);

  // ===============================
  // ✅ POLL CONVERSATIONS (fix: unread badge + list refresh)
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

            // ✅ unread logic: show "1" if there is something newer than last read
            const lastRead = lastReadAtRef.current[otherId];
            const hasNew =
              lastRead && !isNaN(new Date(lastRead))
                ? new Date(updatedAt) > new Date(lastRead)
                : false;

            const unread =
              otherId === openId ? 0 : hasNew ? 1 : Number(old?.unread || 0);

            const displayName =
              (safeString(c.username) ? `@${safeString(c.username)}` : "") ||
              safeString(c.name) ||
              old?.name ||
              `User ${otherId.slice(0, 6)}`;

            next.push({
              userId: otherId,
              name: displayName,
              username: safeString(c.username) || old?.username || "",
              avatar:
                old?.avatar ||
                (displayName?.[0] || otherId?.[0] || "?").toUpperCase(),
              lastMessage: preview,
              updatedAt,
              timestamp: formatTime(updatedAt),
              unread,
              online: Boolean(old?.online),
            });
          }

          next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          return next;
        });
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // ===============================
  // SOCKET CONNECT (fast path)
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

      // Update conversations immediately
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
            unread: isChatOpen ? 0 : 1, // show 1 (your requirement)
          };
        });

        if (!found) {
          updated.unshift({
            userId: otherId,
            name: message.sender?.username
              ? `@${message.sender.username}`
              : `User ${shortId(otherId)}`,
            username: safeString(message.sender?.username),
            avatar: (
              safeString(message.sender?.username)?.[0] ||
              otherId?.[0] ||
              "?"
            ).toUpperCase(),
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: isChatOpen ? 0 : 1,
            online: false,
          });
        }

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return updated;
      });

      if (!isChatOpen) return;

      setMessages((prev) => {
        if (prev.some((m) => safeString(m.id) === safeString(message.id)))
          return prev;
        const merged = [...prev, message];
        lastReadAtRef.current[safeString(otherId)] =
          merged[merged.length - 1]?.createdAt || new Date().toISOString();
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

  // ===============================
  // FILTER CONVERSATIONS
  // ===============================
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
    optimistic.__optimistic = true;

    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");

    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === selectedChatId);

      const updatedConversation = {
        ...(existing || {}),
        userId: selectedChatId,
        name: existing?.name || `User ${shortId(selectedChatId)}`,
        username: existing?.username || "",
        avatar: existing?.avatar || (selectedChatId?.[0] || "?").toUpperCase(),
        lastMessage: text,
        updatedAt: optimistic.createdAt,
        timestamp: formatTime(optimistic.createdAt),
        unread: 0,
        online: existing?.online || false,
      };

      return [
        updatedConversation,
        ...prev.filter((c) => c.userId !== selectedChatId),
      ];
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
    optimistic.__optimistic = true;

    setMessages((prev) => [...prev, optimistic]);

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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
      <div className="messaging-container">
        {/* LEFT PANEL */}
        <aside className="conversations-panel">
          <div className="conversations-header">
            <h2 className="conversations-title">Messages</h2>
          </div>

          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="conversations-list">
            {filteredConversations.map((c) => (
              <button
                key={c.userId}
                type="button"
                className={`conversation-item ${
                  selectedChatId === c.userId ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedChatId(c.userId);

                  // mark read (client-side)
                  lastReadAtRef.current[c.userId] = new Date().toISOString();

                  setConversations((prev) =>
                    prev.map((x) =>
                      x.userId === c.userId ? { ...x, unread: 0 } : x
                    )
                  );

                  // ✅ ensure opening a chat always scrolls to most recent
                  shouldAutoScrollRef.current = true;
                  requestAnimationFrame(() => {
                    messagesEndRef.current?.scrollIntoView({
                      behavior: "auto",
                    });
                  });
                }}
              >
                <div className="conversation-avatar-container">
                  <div className="conversation-avatar">{c.avatar}</div>
                  {c.online && <div className="online-indicator" />}
                </div>

                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">{c.name}</span>
                    <span className="conversation-time">{c.timestamp}</span>
                  </div>

                  <div className="conversation-preview">
                    <span className="last-message">{c.lastMessage || " "}</span>
                    {c.unread > 0 && (
                      <span className="unread-badge">{c.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <div className="empty-left">No conversations found</div>
            )}
          </div>

          {error && <div className="error-banner">{error}</div>}
        </aside>

        {/* RIGHT PANEL */}
        <main className="chat-panel">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar-container">
                    <div className="chat-avatar">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <div className="online-indicator" />
                    )}
                  </div>

                  <div className="chat-user-info">
                    <h3 className="chat-user-name">
                      {selectedConversation.name}
                    </h3>
                    <p className="chat-user-status">
                      {selectedConversation.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                <div className="chat-actions">
                  <button
                    className="chat-action-btn"
                    type="button"
                    aria-label="More"
                  >
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              {/* ✅ SCROLL FIX: attach ref + onScroll here */}
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
                        className={`message ${
                          isOwn ? "message-own" : "message-other"
                        }`}
                      >
                        {!isOwn && (
                          <div className="message-avatar">
                            {selectedConversation.avatar}
                          </div>
                        )}

                        <div className="message-bubble">
                          {isFile ? (
                            <p className="message-content">
                              📎{" "}
                              {m.fileUrl ? (
                                <a
                                  href={m.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "inherit",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {m.fileName || "Attachment"}
                                </a>
                              ) : (
                                m.fileName || "Attachment"
                              )}
                            </p>
                          ) : (
                            <p className="message-content">
                              {safeString(m.content)}
                            </p>
                          )}

                          <div className="message-footer">
                            <span className="message-time">
                              {formatTime(m.createdAt)}
                            </span>
                            {isOwn && (
                              <span className="message-status">
                                {m.read ? (
                                  <FiCheckCircle className="read-icon" />
                                ) : (
                                  <FiCheck className="sent-icon" />
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

              <div className="message-input-container">
                <button
                  className="input-action-btn"
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

                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    className="message-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      uploading ? "Uploading..." : "Type a message..."
                    }
                    disabled={uploading}
                  />

                  <button
                    className="send-btn"
                    type="submit"
                    disabled={!messageInput.trim() || uploading}
                  >
                    <FiSend />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <div className="no-chat-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages;
