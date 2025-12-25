import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { useSearchParams } from "react-router-dom";
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

// Parse attachment created by backend route:
// content: `📎 filename\nhttps://...`
function parseAttachmentFromContent(content) {
  const text = safeString(content);
  if (!text.startsWith("📎")) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const fileName = lines[0].replace(/^📎\s*/, "").trim() || "Attachment";
  const fileUrl = lines[1];

  if (!/^https?:\/\//i.test(fileUrl)) return null;
  return { fileName, fileUrl };
}

const Messages = () => {
  const { user, accessToken, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

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
              safeString(c.user?.name) ||
              safeString(c.otherUser?.name) ||
              `User ${otherUserId}`;

            const username =
              safeString(c.username) ||
              safeString(c.user?.username) ||
              safeString(c.otherUser?.username) ||
              `user_${otherUserId}`;

            const createdAt =
              c.createdAt ||
              c.updatedAt ||
              c.lastMessageAt ||
              new Date().toISOString();

            return {
              userId: otherUserId,
              name: displayName,
              username: safeString(c.username) || "",
              avatar: (
                displayName?.[0] ||
                otherUserId?.[0] ||
                "?"
              ).toUpperCase(),
              lastMessage: safeString(c.lastMessage),
              updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
              timestamp: formatTime(c.updatedAt || Date.now()),
              unread: Number(c.unread || 0),
              online: Boolean(c.online),
            };
          })
          .filter(Boolean);

        // Sort conversations by most recent (timestamp or lastMessageAt)
        const sortedFormatted = formatted.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA; // Most recent first
        });

        setConversations(sortedFormatted);

        // Check if there's a user parameter in URL (from Message button)
        const targetUserId = searchParams.get("user");

        if (targetUserId) {
          // Check if conversation already exists
          const existingConv = formatted.find((c) => c.userId === targetUserId);

          if (existingConv) {
            // Select existing conversation
            setSelectedChatId(targetUserId);
          } else {
            // Create a new conversation placeholder and select it
            // We'll fetch user details from the backend
            fetchUserAndCreateConversation(targetUserId);
          }
        } else {
          // ✅ Auto-select first chat if no user param
          setSelectedChatId((prev) => {
            if (prev) return prev;
            return formatted.length > 0 ? formatted[0].userId : null;
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load conversations.");
      }
    };

    const fetchUserAndCreateConversation = async (userId) => {
      try {
        // Fetch user details from backend
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const userData = await res.json();

          // Create new conversation entry
          const newConv = {
            id: userId,
            userId: userId,
            name: userData.name || `User ${userId}`,
            username: userData.username || `user_${userId}`,
            avatar: (userData.name?.[0] || userId[0] || "?").toUpperCase(),
            lastMessage: "",
            timestamp: "",
            unread: 0,
            online: false,
            createdAt: new Date().toISOString(),
          };

          setConversations((prev) => [newConv, ...prev]);
          setSelectedChatId(userId);
        } else {
          // If user fetch fails, still create a basic conversation
          const newConv = {
            id: userId,
            userId: userId,
            name: `User ${userId.substring(0, 8)}`,
            username: `user_${userId.substring(0, 8)}`,
            avatar: "U",
            lastMessage: "",
            timestamp: "",
            unread: 0,
            online: false,
            createdAt: new Date().toISOString(),
          };

          setConversations((prev) => [newConv, ...prev]);
          setSelectedChatId(userId);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        // Create basic conversation anyway
        const newConv = {
          id: userId,
          userId: userId,
          name: `User ${userId.substring(0, 8)}`,
          username: `user_${userId.substring(0, 8)}`,
          avatar: "U",
          lastMessage: "",
          timestamp: "",
          unread: 0,
          online: false,
          createdAt: new Date().toISOString(),
        };

        setConversations((prev) => [newConv, ...prev]);
        setSelectedChatId(userId);
      }
    };

    fetchConversations();
  }, [accessToken, searchParams]);

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

        const normalized = arr.map((m, idx) => ({
          id: m.id ?? `${m.createdAt || Date.now()}-${idx}`,
          senderId: safeString(m.senderId),
          receiverId: safeString(m.receiverId),
          content: safeString(m.content),
          createdAt: m.createdAt || new Date().toISOString(),
          read: Boolean(m.read),
        }));

        setMessages(normalized);

        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedChatId ? { ...c, unread: 0 } : c
          )
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load messages.");
        setMessages([]);
        setError("Failed to load messages.");
      }
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  /* ===============================
     SOCKET.IO - Real-time messages
  =============================== */
  useEffect(() => {
    if (!accessToken || !user?.id) return;

    // Connect to Socket.io
    const socket = io(API_BASE, {
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    socket.on("receive_message", (message) => {
      console.log("📨 Received message:", message);

      const senderId = safeString(message.senderId);
      const content = safeString(message.content);

      // If the message is from the currently selected chat, add it to messages
      if (senderId === selectedChatId) {
        const newMessage = {
          id: message.id ?? `${Date.now()}`,
          senderId: senderId,
          receiverId: safeString(message.receiverId),
          content: content,
          createdAt: message.createdAt || new Date().toISOString(),
          read: false,
        };
        setMessages((prev) => [...prev, newMessage]);
      }

      // Update conversations list - move this conversation to top and increment unread
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.userId === senderId);

        if (existingIndex !== -1) {
          // Conversation exists - move to top and update
          const updated = [...prev];
          const existing = updated[existingIndex];

          updated.splice(existingIndex, 1);
          updated.unshift({
            ...existing,
            lastMessage: content,
            timestamp: formatTime(new Date()),
            unread:
              senderId === selectedChatId
                ? existing.unread
                : existing.unread + 1,
            createdAt: new Date().toISOString(),
          });

          return updated;
        } else {
          // New conversation - add to top
          return [
            {
              id: senderId,
              userId: senderId,
              name: `User ${senderId.substring(0, 8)}`,
              username: `user_${senderId.substring(0, 8)}`,
              avatar: "U",
              lastMessage: content,
              timestamp: formatTime(new Date()),
              unread: 1,
              online: false,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, user?.id, selectedChatId]);

  /* ===============================
     FILTER CONVERSATIONS
  =============================== */
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
    const optimistic = {
      id: tempId,
      senderId: safeString(user?.id),
      receiverId: safeString(selectedChatId),
      content: text,
      createdAt: new Date().toISOString(),
      read: false,
      __optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");

    // Update left panel preview immediately AND move to top
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.userId === receiverId);

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];

        // Remove from current position
        updated.splice(existingIndex, 1);

        // Add to top with updated info
        updated.unshift({
          ...existing,
          lastMessage: text,
          timestamp: formatTime(new Date().toISOString()),
          unread: 0, // Clear unread when you send
          createdAt: new Date().toISOString(),
        });

        return updated;
      }

      return prev;
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
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
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
    if (!selectedChatId) return;
    fileInputRef.current?.click();
  };

  // ===============================
  // ATTACH: UPLOAD FILE
  // ===============================
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-select same file
    if (!file || !selectedChatId) return;

    const tempId = `temp-file-${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: safeString(user?.id),
      receiverId: safeString(selectedChatId),
      content: `📎 ${file.name}\nUploading...`,
      createdAt: new Date().toISOString(),
      read: false,
      __optimistic: true,
    };

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

      // Backend returns:
      // { message, attachment: { url, name, ... } }
      const payload = await res.json();

      const savedMessage = payload?.message ?? payload; // fallback if your route returns just message

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? savedMessage : m))
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to upload file.");
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

                {/* ✅ Removed call/video buttons; keep only More */}
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

                    const attachment = parseAttachmentFromContent(m.content);

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
                          {attachment ? (
                            <p className="message-content">
                              📎{" "}
                              <a
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "inherit",
                                  textDecoration: "underline",
                                }}
                              >
                                {attachment.fileName}
                              </a>
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
                {/* ✅ Attach is functional */}
                <button
                  className="input-action-btn"
                  type="button"
                  aria-label="Attach"
                  onClick={handleAttachClick}
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
                    placeholder="Type a message..."
                  />

                  {/* ✅ Removed emoji button */}

                  <button
                    className="send-btn"
                    type="submit"
                    disabled={!messageInput.trim()}
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
