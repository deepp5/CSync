import React, { useEffect, useMemo, useState, useRef } from "react";
import "./Messages.css";
import {
  FiSearch,
  FiMoreVertical,
  FiSend,
  FiPaperclip,
  FiSmile,
  FiPhone,
  FiVideo,
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

const Messages = () => {
  const { user, accessToken, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null); // always a STRING userId
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  /* ===============================
     FETCH CONVERSATIONS
  =============================== */
  useEffect(() => {
    if (!accessToken) return;

    const fetchConversations = async () => {
      setError("");
      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`GET /conversations failed (${res.status}) ${txt}`);
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        // Normalize backend -> UI
        const formatted = arr
          .map((c) => {
            const otherUserId =
              safeString(c.userId) ||
              safeString(c.otherUserId) ||
              safeString(c.partnerId) ||
              safeString(c.user_id);

            if (!otherUserId) return null;

            const displayName =
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
              c.createdAt || c.updatedAt || c.lastMessageAt || new Date().toISOString();

            return {
              id: otherUserId, // IMPORTANT: id is the other user's id (string)
              userId: otherUserId,
              name: displayName,
              username,
              avatar: (
                displayName?.[0] ||
                otherUserId?.[0] ||
                "?"
              ).toUpperCase(),
              lastMessage: safeString(c.lastMessage) || "",
              timestamp: formatTime(createdAt),
              unread: Number(c.unread || 0),
              online: Boolean(c.online || false),
              createdAt,
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
        const targetUserId = searchParams.get('user');
        
        if (targetUserId) {
          // Check if conversation already exists
          const existingConv = formatted.find(c => c.userId === targetUserId);
          
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

  /* ===============================
     FETCH MESSAGES (when chat selected)
  =============================== */
  useEffect(() => {
    if (!selectedChatId || !accessToken) return;

    const fetchMessages = async () => {
      setError("");
      try {
        const res = await fetch(`${API_BASE}/messages/${selectedChatId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `GET /messages/${selectedChatId} failed (${res.status}) ${txt}`
          );
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        // Normalize messages just in case
        const normalized = arr.map((m, idx) => ({
          id: m.id ?? `${m.createdAt || Date.now()}-${idx}`,
          senderId: safeString(m.senderId || m.sender_id),
          receiverId: safeString(m.receiverId || m.receiver_id),
          content: safeString(m.content || m.message),
          createdAt: m.createdAt || m.created_at || new Date().toISOString(),
          read: Boolean(m.read),
        }));

        setMessages(normalized);

        // Clear unread count when opening a conversation
        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedChatId ? { ...c, unread: 0 } : c
          )
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load messages.");
        setMessages([]);
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
            unread: senderId === selectedChatId ? existing.unread : existing.unread + 1,
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
      (conv) =>
        conv.name.toLowerCase().includes(q) ||
        conv.username.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.userId === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  /* ===============================
     SEND MESSAGE
  =============================== */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError("");

    const text = messageInput.trim();
    const receiverId = safeString(selectedConversation?.userId); // ✅ always comes from selected conversation

    // Debug
    console.log("SEND handler fired", { receiverId, text });

    if (!text) return;
    if (!receiverId) {
      setError("No conversation selected.");
      return;
    }
    if (!accessToken) {
      setError("Missing access token.");
      return;
    }

    // Optimistic message (shows immediately)
    const tempId = `temp-${Date.now()}`;
    const myId = safeString(user?.id);
    const optimistic = {
      id: tempId,
      senderId: myId,
      receiverId,
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
        body: JSON.stringify({ receiverId, content: text }),
      });

      // If backend errors, put UI back
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("POST /messages failed:", res.status, txt);

        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError("Failed to send message (backend error).");
        return;
      }

      const saved = await res.json();

      const savedMsg = {
        id: saved.id ?? tempId,
        senderId: safeString(saved.senderId || saved.sender_id),
        receiverId: safeString(saved.receiverId || saved.receiver_id),
        content: safeString(saved.content || saved.message),
        createdAt: saved.createdAt || saved.created_at || optimistic.createdAt,
        read: Boolean(saved.read),
      };

      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMsg : m)));
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to send message (network error).");
    }
  };

  if (loading) return null;

  return (
    <div className="messaging-page">
      <div className="messaging-container">
        {/* Left Side - Conversations List */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <h2 className="conversations-title">Messages</h2>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Conversations List */}
          <div className="conversations-list">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.userId}
                className={`conversation-item ${
                  selectedChatId === conversation.userId ? "active" : ""
                }`}
                onClick={() => setSelectedChatId(conversation.userId)}
              >
                <div className="conversation-avatar-container">
                  <div className="conversation-avatar">
                    {conversation.avatar}
                  </div>
                  {conversation.online && (
                    <div className="online-indicator"></div>
                  )}
                </div>

                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">
                      {conversation.name}
                    </span>
                    <span className="conversation-time">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    <span className="last-message">
                      {conversation.lastMessage}
                    </span>
                    {conversation.unread > 0 && (
                      <span className="unread-badge">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{ padding: "10px", color: "#ff6b6b", fontSize: "0.9rem" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Right Side - Chat Window */}
        <div className="chat-panel">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar-container">
                    <div className="chat-avatar">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <div className="online-indicator"></div>
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
                  <button className="chat-action-btn" type="button">
                    <FiPhone />
                  </button>
                  <button className="chat-action-btn" type="button">
                    <FiVideo />
                  </button>
                  <button className="chat-action-btn" type="button">
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((message) => {
                    const isOwn =
                      safeString(message.senderId) === safeString(user?.id);

                    return (
                      <div
                        key={message.id}
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
                          <p className="message-content">{message.content}</p>
                          <div className="message-footer">
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <span className="message-status">
                                {message.read ? (
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
                </div>
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <button className="input-action-btn" type="button">
                  <FiPaperclip />
                </button>

                {/* ✅ Put send inside form so Enter + click both work */}
                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />

                  <button className="input-action-btn" type="button">
                    <FiSmile />
                  </button>

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
        </div>
      </div>
    </div>
  );
};

export default Messages;