import React, { useEffect, useState } from "react";
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

const Messages = () => {
  const { user, accessToken, loading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* ===============================
     FETCH CONVERSATIONS
  =============================== */
  useEffect(() => {
    if (!accessToken) return;

    const fetchConversations = async () => {
      const res = await fetch("http://localhost:5051/conversations", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      // 🔥 Normalize backend → UI format (ONCE)
      const formatted = data.map((c) => ({
        id: c.userId,
        name: `User ${c.userId}`,
        username: c.userId,
        avatar: c.userId?.[0]?.toUpperCase() || "?",
        lastMessage: c.lastMessage || "",
        timestamp: new Date(c.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unread: 0,
        online: false,
      }));

      setConversations(formatted);
    };

    fetchConversations();
  }, [accessToken]);

  /* ===============================
     FETCH MESSAGES
  =============================== */
  useEffect(() => {
    if (!selectedChatId || !accessToken) return;

    const fetchMessages = async () => {
      const res = await fetch(
        `http://localhost:5051/messages/${selectedChatId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();
  }, [selectedChatId, accessToken]);

  /* ===============================
     SEND MESSAGE
  =============================== */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;

    const res = await fetch("http://localhost:5051/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        receiverId: selectedChatId,
        content: messageInput,
      }),
    });

    const newMessage = await res.json();
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  /* ===============================
     FILTER CONVERSATIONS
  =============================== */
  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(
    (c) => c.id === selectedChatId
  );

  if (loading) return null;

  return (
    <div className="messaging-page">
      <div className="messaging-container">
        {/* LEFT PANEL */}
        <div className="conversations-panel">
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
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedChatId === conversation.id ? "active" : ""
                }`}
                onClick={() => setSelectedChatId(conversation.id)}
              >
                <div className="conversation-avatar-container">
                  <div className="conversation-avatar">
                    {conversation.avatar}
                  </div>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="chat-panel">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">
                    {selectedConversation.avatar}
                  </div>
                  <div className="chat-user-info">
                    <h3 className="chat-user-name">
                      {selectedConversation.name}
                    </h3>
                    <p className="chat-user-status">Offline</p>
                  </div>
                </div>

                <div className="chat-actions">
                  <FiPhone />
                  <FiVideo />
                  <FiMoreVertical />
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user.id;

                    return (
                      <div
                        key={msg.id}
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
                          <p className="message-content">{msg.content}</p>
                          <div className="message-footer">
                            <span className="message-time">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isOwn && (
                              <span className="message-status">
                                {msg.read ? <FiCheckCircle /> : <FiCheck />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input */}
              <div className="message-input-container">
                <FiPaperclip />
                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    className="message-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                </form>
                <FiSmile />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <FiSend />
                </button>
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
