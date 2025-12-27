// PostDetailPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import "./PostDetail.css";
import {
  FiUser,
  FiMail,
  FiMessageSquare,
  FiHeart,
  FiShare2,
  FiEye,
  FiArrowLeft,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import { IoIosArrowForward } from "react-icons/io";

function safeString(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const viewCountedRef = useRef({});

  // ===============================
  // COMMENTS: FETCH
  // ===============================
  const fetchComments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const token = session.access_token;

      const res = await axios.get(
        `http://localhost:5051/posts/${id}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  // ===============================
  // POST: FETCH
  // ===============================
  useEffect(() => {
    let isMounted = true;

    async function fetchPost() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const token = session.access_token;

        const response = await axios.get(`http://localhost:5051/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        setPost(response.data);
        setLikeCount(response.data.likes || 0);
        setViewCount(response.data.views || 0);

        await fetchComments();

        setIsLiked(response.data.isLiked || false);
        setIsFollowing(response.data.isFollowing || false);
        setLoading(false);

        if (!viewCountedRef.current[id]) {
          viewCountedRef.current[id] = true;

          const viewResponse = await axios
            .post(
              `http://localhost:5051/posts/${id}/view`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch((err) => console.error("Error incrementing view:", err));

          if (isMounted && viewResponse?.data?.views) {
            setViewCount(viewResponse.data.views);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        if (isMounted) {
          setPost(null);
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleLike = async () => {
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
        navigate("/login");
        return;
      }

      const token = session.access_token;

      if (previousIsLiked) {
        await axios.delete(`http://localhost:5051/posts/${id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `http://localhost:5051/posts/${id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    }
  };

  const handleFollow = async () => {
    const previousIsFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsFollowing(previousIsFollowing);
        navigate("/login");
        return;
      }

      const token = session.access_token;

      const userId = post?.User?.id;
      if (!userId) return;

      if (previousIsFollowing) {
        await axios.delete(`http://localhost:5051/users/${userId}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `http://localhost:5051/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      setIsFollowing(previousIsFollowing);
    }
  };

  const handleShare = () => {
    if (!post) return;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description.substring(0, 100) + "...",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // ===============================
  // COMMENTS: SUBMIT (NEW OR REPLY)
  // ===============================
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const token = session.access_token;

      await axios.post(
        `http://localhost:5051/posts/${id}/comments`,
        { content: newComment.trim(), parentId: replyTo || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewComment("");
      setReplyTo(null);
      await fetchComments();
    } catch (err) {
      console.error("Error creating comment:", err);
      alert("Failed to post comment");
    }
  };

  // ✅ UPDATED: open Messages page with this user selected (even if new)
  const handleContactOwner = () => {
    const author = post?.User;
    const authorId = safeString(author?.id);
    if (!authorId) return;

    sessionStorage.setItem("activeChatId", authorId);
    sessionStorage.setItem(
      "activeChatMeta",
      JSON.stringify({
        userId: authorId,
        username: safeString(author?.username),
        name: safeString(author?.name),
      })
    );

    navigate("/messages");
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

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
    };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyClass = (difficulty) => {
    const classes = {
      BEGINNER: "difficulty-easy",
      INTERMEDIATE: "difficulty-medium",
      ADVANCED: "difficulty-hard",
    };
    return classes[difficulty] || "difficulty-medium";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      WEB_DEVELOPMENT: "Web Development",
      MOBILE: "Mobile",
      AI_ML: "AI/ML",
      GAME_DEV: "Game Dev",
      SYSTEMS: "Systems",
      OTHER: "Other",
    };
    return labels[category] || category;
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

  const profileUsername = post?.User?.username;
  const profilePath = profileUsername ? `/profile/${profileUsername}` : null;

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <div className="post-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>

        <div className="post-content-wrapper">
          {/* Main Content */}
          <div className="post-main-content">
            <div className="post-title-row">
              <h1 className="post-title">{post.title}</h1>
              <div className="post-actions-top">
                <button
                  className={`action-btn-icon ${isLiked ? "liked" : ""}`}
                  onClick={handleLike}
                  title="Like"
                >
                  <FiHeart />
                </button>
                <button
                  className="action-btn-icon"
                  onClick={handleShare}
                  title="Share"
                >
                  <FiShare2 />
                </button>
              </div>
            </div>

            <div className="post-meta-badges">
              <span className="category-badge">
                {getCategoryLabel(post.category)}
              </span>
              <span
                className={`difficulty-badge ${getDifficultyClass(
                  post.difficulty
                )}`}
              >
                {getDifficultyLabel(post.difficulty)}
              </span>
            </div>

            <div className="post-description-section">
              <h3 className="description-title">Description:</h3>
              <div className="post-description">{post.description}</div>
            </div>

            <div className="post-separator"></div>

            <div className="post-tech-stack">
              <div className="tech-stack-tags">
                {post.techStack &&
                  post.techStack.map((tech, index) => (
                    <span key={index} className="tech-tag">
                      {tech}
                    </span>
                  ))}
              </div>
            </div>

            <div className="post-separator"></div>

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="comments-title">Comments ({comments.length})</h3>

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

                <div className="comment-input-wrapper">
                  <textarea
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows="1"
                  />
                  <button type="submit" className="submit-comment-btn">
                    <IoIosArrowForward />
                  </button>
                </div>
              </form>

              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-avatar">
                      {comment.author?.avatar || "U"}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">
                          {comment.author?.name || "Anonymous"}
                        </span>
                        <span className="comment-username">
                          {comment.author?.username ? `@${comment.author.username}` : ""}
                        </span>
                        <span className="comment-time">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      <div className="comment-actions">
                        <button className="comment-action-btn" type="button">
                          <FiHeart /> {comment.likes || 0}
                        </button>
                        <button
                          className="comment-action-btn"
                          type="button"
                          onClick={() => setReplyTo(comment.id)}
                        >
                          Reply
                        </button>
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="comment reply">
                              <div className="comment-avatar">
                                {reply.author?.avatar || "U"}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">
                                    {reply.author?.name || "Anonymous"}
                                  </span>
                                  <span className="comment-username">
                                    {reply.author?.username ? `@${reply.author.username}` : ""}
                                  </span>
                                  <span className="comment-time">
                                    {getTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="comment-text">{reply.content}</p>
                                <div className="comment-actions">
                                  <button
                                    className="comment-action-btn"
                                    type="button"
                                  >
                                    <FiHeart /> {reply.likes || 0}
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
              <div className="author-info">
                {profilePath ? (
                  <Link to={profilePath} className="author-profile-link">
                    <div className="author-avatar-large">
                      {post.User?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Link>
                ) : (
                  <div className="author-avatar-large">
                    {post.User?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                {profilePath ? (
                  <Link to={profilePath} className="author-profile-link">
                    <h4 className="author-name">
                      {post.User?.name || "Anonymous"}
                    </h4>
                  </Link>
                ) : (
                  <h4 className="author-name">
                    {post.User?.name || "Anonymous"}
                  </h4>
                )}

                <p className="author-username">
                  {post.User?.username ? `@${post.User.username}` : ""}
                </p>
                <p className="author-bio">
                  {post.User?.bio || "No bio available"}
                </p>
              </div>

              <div className="author-social">
                {post.User?.githubUrl && (
                  <a
                    href={post.User.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <FiGithub /> GitHub
                  </a>
                )}
                {post.User?.linkedinUrl && (
                  <a
                    href={post.User.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <FiLinkedin /> LinkedIn
                  </a>
                )}
              </div>

              {/* ✅ UPDATED */}
              <button className="contact-btn" onClick={handleContactOwner}>
                <FiMail /> Message
              </button>

              <button
                className={`follow-btn ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
              >
                <FiUser /> {isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            <div className="stats-card">
              <h3 className="sidebar-title">Post Stats</h3>
              <div className="stat-item">
                <FiEye className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">
                    {viewCount.toLocaleString()}
                  </span>
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