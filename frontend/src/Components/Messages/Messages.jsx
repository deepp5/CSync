// MessagingPage.jsx
import React, { useState } from 'react';
import './Messages.css';
import { 
  FiSearch, 
  FiMoreVertical, 
  FiSend, 
  FiPaperclip,
  FiSmile,
  FiPhone,
  FiVideo,
  FiCheck,
  FiCheckCircle
} from 'react-icons/fi';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for conversations
  const [conversations] = useState([
    {
      id: 1,
      name: 'Sarah Chen',
      username: 'sarah_c',
      avatar: 'S',
      lastMessage: 'Hey! Did you see the new project I posted?',
      timestamp: '2m ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      username: 'mike_r',
      avatar: 'M',
      lastMessage: 'Thanks for the feedback!',
      timestamp: '15m ago',
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: 'Alex Johnson',
      username: 'alexj_dev',
      avatar: 'A',
      lastMessage: 'Can we schedule a call tomorrow?',
      timestamp: '1h ago',
      unread: 1,
      online: false
    },
    {
      id: 4,
      name: 'Emma Wilson',
      username: 'emma_w',
      avatar: 'E',
      lastMessage: 'Sure, I\'d love to collaborate!',
      timestamp: '3h ago',
      unread: 0,
      online: false
    },
    {
      id: 5,
      name: 'David Kim',
      username: 'david_k',
      avatar: 'D',
      lastMessage: 'Check out this article I found',
      timestamp: '1d ago',
      unread: 0,
      online: false
    }
  ]);

  // Mock messages for selected chat
  const [messages, setMessages] = useState({
    1: [
      {
        id: 1,
        sender: 'Sarah Chen',
        content: 'Hey! How are you doing?',
        timestamp: '10:30 AM',
        isOwn: false
      },
      {
        id: 2,
        sender: 'You',
        content: 'Hi Sarah! I\'m doing great, thanks for asking!',
        timestamp: '10:32 AM',
        isOwn: true,
        read: true
      },
      {
        id: 3,
        sender: 'Sarah Chen',
        content: 'Did you see the new project I posted? I think you might find it interesting.',
        timestamp: '10:35 AM',
        isOwn: false
      },
      {
        id: 4,
        sender: 'You',
        content: 'Not yet, but I\'ll check it out right away!',
        timestamp: '10:36 AM',
        isOwn: true,
        read: true
      },
      {
        id: 5,
        sender: 'Sarah Chen',
        content: 'Awesome! Let me know what you think. I\'d love to get your feedback.',
        timestamp: '10:38 AM',
        isOwn: false
      }
    ],
    2: [
      {
        id: 1,
        sender: 'Mike Rodriguez',
        content: 'Thanks for the feedback on my project!',
        timestamp: '9:15 AM',
        isOwn: false
      },
      {
        id: 2,
        sender: 'You',
        content: 'No problem! It looks really solid.',
        timestamp: '9:20 AM',
        isOwn: true,
        read: true
      }
    ]
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      sender: 'You',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      isOwn: true,
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage]
    }));

    setMessageInput('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(c => c.id === selectedChat);
  const currentMessages = selectedChat ? messages[selectedChat] || [] : [];

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
                key={conversation.id}
                className={`conversation-item ${selectedChat === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div className="conversation-avatar-container">
                  <div className="conversation-avatar">
                    {conversation.avatar}
                  </div>
                  {conversation.online && <div className="online-indicator"></div>}
                </div>
                
                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">{conversation.name}</span>
                    <span className="conversation-time">{conversation.timestamp}</span>
                  </div>
                  <div className="conversation-preview">
                    <span className="last-message">{conversation.lastMessage}</span>
                    {conversation.unread > 0 && (
                      <span className="unread-badge">{conversation.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                    {selectedConversation.online && <div className="online-indicator"></div>}
                  </div>
                  <div className="chat-user-info">
                    <h3 className="chat-user-name">{selectedConversation.name}</h3>
                    <p className="chat-user-status">
                      {selectedConversation.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="chat-actions">
                  <button className="chat-action-btn">
                    <FiPhone />
                  </button>
                  <button className="chat-action-btn">
                    <FiVideo />
                  </button>
                  <button className="chat-action-btn">
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-container">
                <div className="messages-list">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.isOwn ? 'message-own' : 'message-other'}`}
                    >
                      {!message.isOwn && (
                        <div className="message-avatar">
                          {selectedConversation.avatar}
                        </div>
                      )}
                      <div className="message-bubble">
                        <p className="message-content">{message.content}</p>
                        <div className="message-footer">
                          <span className="message-time">{message.timestamp}</span>
                          {message.isOwn && (
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
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <button className="input-action-btn">
                  <FiPaperclip />
                </button>
                
                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                </form>

                <button className="input-action-btn">
                  <FiSmile />
                </button>

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
            /* No Chat Selected */
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