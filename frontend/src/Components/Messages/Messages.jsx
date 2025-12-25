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

  // If backend is returning a "file" message with fields
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
    content, // keep original content for text
    createdAt: raw?.createdAt || new Date().toISOString(),
    read: Boolean(raw?.read),
    type,
    fileName,
    fileUrl,
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

  // ✅ hidden file input for attachments
  const fileInputRef = useRef(null);

  // ===============================
  // FETCH CONVERSATIONS
  // ===============================
  useEffect(() => {
    if (!accessToken) return;

    const fetchConversations = async () => {
      setError("");
      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
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

            // ✅ never show raw link in preview
            const legacy = parseLegacyAttachment(safeString(c.lastMessage));
            const preview = legacy
              ? `📎 ${legacy.name}`
              : safeString(c.lastMessage);

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
              updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
              timestamp: formatTime(c.updatedAt || c.createdAt || Date.now()),
              unread: Number(c.unread || 0),
              online: Boolean(c.online),
            };
          })
          .filter(Boolean);

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
        });

        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        const normalized = arr.map((m, idx) =>
          normalizeMessage(m, m.id ?? `${m.createdAt || Date.now()}-${idx}`)
        );

        setMessages(normalized);

        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedChatId ? { ...c, unread: 0 } : c
          )
        );
      } catch (e) {
        console.error(e);
        setMessages([]);
        setError("Failed to load messages.");
      }
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  // ===============================
  // AUTO SCROLL
  // ===============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===============================
  // SOCKET CONNECT (ONCE)
  // ===============================
  useEffect(() => {
    if (!accessToken) return;

    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        auth: { token: accessToken },
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => {
        console.log("🟢 socket connected:", socketRef.current.id);
      });

      socketRef.current.on("connect_error", (e) => {
        console.log("🔴 socket connect_error:", e.message);
      });
    }
  }, [accessToken]);

  // ===============================
  // SOCKET: RECEIVE MESSAGE (REALTIME)
  // ===============================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user?.id) return;

    const myId = safeString(user.id);

    const onNewMessage = (raw) => {
      const message = normalizeMessage(raw, raw?.id ?? `socket-${Date.now()}`);

      const senderId = safeString(message.senderId);
      const receiverId = safeString(message.receiverId);
      const otherId = senderId === myId ? receiverId : senderId;

      setConversations((prev) => {
        const isChatOpen = safeString(selectedChatId) === safeString(otherId);
        let found = false;

        const preview =
          message.type === "file"
            ? `📎 ${message.fileName || "Attachment"}`
            : safeString(message.content);

        const updated = prev.map((c) => {
          if (c.userId !== otherId) return c;
          found = true;
          return {
            ...c,
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: isChatOpen ? 0 : Number(c.unread || 0) + 1,
          };
        });

        if (!found) {
          updated.unshift({
            userId: otherId,
            name: `User ${shortId(otherId)}`,
            username: "",
            avatar: (otherId?.[0] || "?").toUpperCase(),
            lastMessage: preview,
            updatedAt: message.createdAt || new Date().toISOString(),
            timestamp: formatTime(message.createdAt),
            unread: safeString(selectedChatId) === safeString(otherId) ? 0 : 1,
            online: false,
          });
        }

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return updated;
      });

      if (safeString(selectedChatId) !== safeString(otherId)) return;

      setMessages((prev) => {
        if (prev.some((m) => safeString(m.id) === safeString(message.id)))
          return prev;
        return [...prev, message];
      });
    };

    socket.on("new_message", onNewMessage);
    return () => socket.off("new_message", onNewMessage);
  }, [user?.id, selectedChatId]);

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
  // ATTACH: PICK FILE
  // ===============================
  const handleAttachClick = () => {
    if (!selectedChatId || uploading) return;
    fileInputRef.current?.click();
  };

  // ===============================
  // ATTACH: UPLOAD FILE
  // ===============================
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-select same file

    if (!file || !selectedChatId) return;

    setUploading(true);
    setError("");

    const tempId = `temp-file-${Date.now()}`;

    // optimistic bubble
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

      // ✅ IMPORTANT: backend returns { message, attachment }
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
                  setConversations((prev) =>
                    prev.map((x) =>
                      x.userId === c.userId ? { ...x, unread: 0 } : x
                    )
                  );
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

              <div className="messages-container">
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
                {/* ✅ Attach */}
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

                {/* hidden input */}
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
