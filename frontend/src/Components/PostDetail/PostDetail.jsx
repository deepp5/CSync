// PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.css';
import { 
  FiUser, 
  FiMail, 
  FiMessageSquare, 
  FiHeart, 
  FiBookmark,
  FiShare2,
  FiClock,
  FiEye,
  FiSend,
  FiMoreVertical,
  FiArrowLeft,
  FiGithub,
  FiLinkedin
} from 'react-icons/fi';

const PostDetail = () => {
  const { id } = useParams(); // Get post ID from URL
  const navigate = useNavigate();
  
  // Mock post data - replace with actual API call
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // Fetch post data based on ID
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPost = {
        id: id,
        title: 'Building a Real-Time Collaboration Platform',
        description: `This is a comprehensive guide and showcase of a real-time collaboration platform I've been working on. 

The platform enables teams to work together seamlessly with features like live document editing, video conferencing, and project management tools all in one place.

**Key Features:**
- Real-time collaborative editing with operational transformation
- Integrated video/audio conferencing using WebRTC
- Advanced project management with Kanban boards
- Role-based access control and permissions
- Real-time notifications and activity feeds
- File sharing and cloud storage integration

**Technical Stack:**
- Frontend: React, TypeScript, Socket.io-client
- Backend: Node.js, Express, Socket.io
- Database: MongoDB with Redis for caching
- Real-time: WebSocket connections for instant updates
- Authentication: JWT with refresh tokens

**Challenges Overcome:**
One of the biggest challenges was handling conflict resolution in real-time editing. I implemented operational transformation algorithms to ensure consistency across all connected clients.

**What's Next:**
I'm currently working on mobile apps for iOS and Android, and planning to add AI-powered features like smart task suggestions and automated meeting summaries.

Feel free to reach out if you want to collaborate or have any questions!`,
        category: 'Web Development',
        tags: ['React', 'Node.js', 'WebSocket', 'Real-time', 'Collaboration'],
        author: {
          name: 'Alex Johnson',
          username: 'alexj_dev',
          avatar: 'A',
          bio: 'Full-stack developer passionate about real-time systems',
          email: 'alex.johnson@example.com',
          github: 'https://github.com/alexj',
          linkedin: 'https://linkedin.com/in/alexj'
        },
        createdAt: '2024-01-15T10:30:00Z',
        likes: 234,
        views: 1542,
        commentCount: 18,
        images: [] // Optional images
      };
      
      setPost(mockPost);
      setLikeCount(mockPost.likes);
      setViewCount(mockPost.views);
      
      // Mock comments
      setComments([
        {
          id: 1,
          author: {
            name: 'Sarah Chen',
            username: 'sarah_c',
            avatar: 'S'
          },
          content: 'This is amazing! I\'ve been looking for something exactly like this. How did you handle the WebRTC signaling?',
          createdAt: '2024-01-15T11:00:00Z',
          likes: 12,
          replies: [
            {
              id: 2,
              author: {
                name: 'Alex Johnson',
                username: 'alexj_dev',
                avatar: 'A'
              },
              content: 'Thanks Sarah! I used a custom signaling server with Socket.io. Happy to share more details if you\'re interested.',
              createdAt: '2024-01-15T11:15:00Z',
              likes: 8
            }
          ]
        },
        {
          id: 3,
          author: {
            name: 'Mike Rodriguez',
            username: 'mike_r',
            avatar: 'M'
          },
          content: 'Great work! Have you considered using CRDTs instead of OT? Might simplify the conflict resolution.',
          createdAt: '2024-01-15T12:30:00Z',
          likes: 5,
          replies: []
        }
      ]);
      
      setLoading(false);
    }, 500);
  }, [id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description.substring(0, 100) + '...',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      author: {
        name: 'Current User',
        username: 'current_user',
        avatar: 'C'
      },
      content: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    if (replyTo) {
      // Add as reply
      setComments(comments.map(c => {
        if (c.id === replyTo) {
          return {
            ...c,
            replies: [...c.replies, comment]
          };
        }
        return c;
      }));
      setReplyTo(null);
    } else {
      // Add as new comment
      setComments([comment, ...comments]);
    }

    setNewComment('');
  };

  const handleContactOwner = () => {
    window.location.href = `mailto:${post.author.email}`;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="error-container">
          <h2>Post not found</h2>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        {/* Header with back button */}
        <div className="post-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
          <div className="post-meta-info">
            <span className="post-views">
              <FiEye /> {viewCount.toLocaleString()} views
            </span>
            <span className="post-time">
              <FiClock /> {getTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="post-content-wrapper">
          {/* Main Content */}
          <div className="post-main-content">
            {/* Post Title & Category */}
            <div className="post-title-section">
              <span className="post-category">{post.category}</span>
              <h1 className="post-title">{post.title}</h1>
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="post-tag">{tag}</span>
                ))}
              </div>
            </div>

            {/* Post Description */}
            <div className="post-description">
              {post.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="post-actions">
              <button 
                className={`action-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <FiHeart /> {likeCount}
              </button>
              <button 
                className={`action-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSave}
              >
                <FiBookmark /> {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="action-btn" onClick={handleShare}>
                <FiShare2 /> Share
              </button>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="comments-title">
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                {replyTo && (
                  <div className="reply-indicator">
                    Replying to comment...
                    <button 
                      type="button"
                      className="cancel-reply"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <textarea
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                />
                <button type="submit" className="submit-comment-btn">
                  <FiSend /> Post Comment
                </button>
              </form>

              {/* Comments List */}
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-avatar">
                      {comment.author.avatar}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author.name}</span>
                        <span className="comment-username">@{comment.author.username}</span>
                        <span className="comment-time">{getTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      <div className="comment-actions">
                        <button className="comment-action-btn">
                          <FiHeart /> {comment.likes}
                        </button>
                        <button 
                          className="comment-action-btn"
                          onClick={() => setReplyTo(comment.id)}
                        >
                          Reply
                        </button>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="replies">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="comment reply">
                              <div className="comment-avatar">
                                {reply.author.avatar}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">{reply.author.name}</span>
                                  <span className="comment-username">@{reply.author.username}</span>
                                  <span className="comment-time">{getTimeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="comment-text">{reply.content}</p>
                                <div className="comment-actions">
                                  <button className="comment-action-btn">
                                    <FiHeart /> {reply.likes}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Author Info */}
          <div className="post-sidebar">
            <div className="author-card">
              <h3 className="sidebar-title">About the Author</h3>
              
              <div className="author-info">
                <div className="author-avatar-large">
                  {post.author.avatar}
                </div>
                <h4 className="author-name">{post.author.name}</h4>
                <p className="author-username">@{post.author.username}</p>
                <p className="author-bio">{post.author.bio}</p>
              </div>

              <div className="author-social">
                <a 
                  href={post.author.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <FiGithub /> GitHub
                </a>
                <a 
                  href={post.author.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <FiLinkedin /> LinkedIn
                </a>
              </div>

              <button className="contact-btn" onClick={handleContactOwner}>
                <FiMail /> Contact Author
              </button>
              
              <button className="follow-btn">
                <FiUser /> Follow
              </button>
            </div>

            {/* Related Stats */}
            <div className="stats-card">
              <h3 className="sidebar-title">Post Stats</h3>
              <div className="stat-item">
                <FiEye className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{viewCount.toLocaleString()}</span>
                  <span className="stat-label">Views</span>
                </div>
              </div>
              <div className="stat-item">
                <FiHeart className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{likeCount}</span>
                  <span className="stat-label">Likes</span>
                </div>
              </div>
              <div className="stat-item">
                <FiMessageSquare className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{comments.length}</span>
                  <span className="stat-label">Comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;