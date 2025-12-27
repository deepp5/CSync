// PostDetailPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { prefetchCache } from "../../utils/prefetchCache";
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
import {Link} from "react-router-dom"

const PostDetail = () => {
  const { id } = useParams(); // Get post ID from URL
  const navigate = useNavigate();
  const location = useLocation();

  // Allow instant render when navigating from a card by passing state: { post }
  const statePost = location?.state?.post || null;

  // Simple cache keys
  const postCacheKey = `post:detail:${id}`;
  const commentsCacheKey = `post:comments:${id}`;

  const cachedPost = prefetchCache.get(`post:detail:${id}`);
  const [post, setPost] = useState(cachedPost || null);
  // loading is only used for skeletons, based on post === null

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Track if we've already counted the view for this post
  const viewCountedRef = useRef({});

  // ===============================
  // COMMENTS: FETCH
  // ===============================
  const fetchComments = async () => {
    // Use cache first
    const cachedComments = prefetchCache.get(`post:comments:${id}`);
    if (cachedComments) {
      setComments(cachedComments);
    }
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

      const nextComments = Array.isArray(res.data) ? res.data : [];
      setComments(nextComments);
      prefetchCache.set(`post:comments:${id}`, nextComments);
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

    // Use cache first before any async calls
    const cacheKey = `post:detail:${id}`;
    const cached = prefetchCache.get(cacheKey);
    if (cached) {
      setPost(cached);
      setLikeCount(cached.likes || 0);
      setViewCount(cached.views || 0);
      setIsLiked(!!cached.isLiked);
      setIsFollowing(!!cached.isFollowing);
    }

    // Seed comments from cache if present (also instant)
    const cachedComments = prefetchCache.get(`post:comments:${id}`);
    if (Array.isArray(cachedComments)) {
      setComments(cachedComments);
    }

    async function fetchPostFresh() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const token = session.access_token;

        const response = await axios.get(`http://localhost:5051/posts/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!isMounted) return;

        const fresh = response.data;

        setPost(fresh);
        setLikeCount(fresh.likes || 0);
        setViewCount(fresh.views || 0);
        setIsLiked(!!fresh.isLiked);
        setIsFollowing(!!fresh.isFollowing);

        // Cache the fresh detail payload for future instant opens
        prefetchCache.set(cacheKey, fresh);

        // Load comments AFTER first paint (non-blocking)
        setTimeout(async () => {
          try {
            const res = await axios.get(
              `http://localhost:5051/posts/${id}/comments`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const nextComments = Array.isArray(res.data) ? res.data : [];
            if (!isMounted) return;
            setComments(nextComments);
            prefetchCache.set(`post:comments:${id}`, nextComments);
          } catch (err) {
            console.error("Error fetching comments:", err);
          }
        }, 0);

        // Increment view count AFTER paint (only once per id)
        if (!viewCountedRef.current[id]) {
          viewCountedRef.current[id] = true;
          setTimeout(async () => {
            try {
              const viewResponse = await axios.post(
                `http://localhost:5051/posts/${id}/view`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (isMounted && viewResponse?.data?.views) {
                setViewCount(viewResponse.data.views);

                // Keep cache in sync
                const curr = prefetchCache.get(cacheKey);
                if (curr) {
                  prefetchCache.set(cacheKey, { ...curr, views: viewResponse.data.views });
                }
              }
            } catch (err) {
              console.error("Error incrementing view:", err);
            }
          }, 0);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        if (isMounted) {
          // Only show "not found" if we truly have nothing to render
          if (!prefetchCache.get(cacheKey)) {
            setPost(null);
          }
        }
      }
    }

    fetchPostFresh();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleLike = async () => {
    // Store previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // OPTIMISTIC UPDATE - Update UI immediately
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Rollback if not authenticated
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
        navigate("/login");
        return;
      }

      const token = session.access_token;

      if (previousIsLiked) {
        // Unlike the post
        await axios.delete(`http://localhost:5051/posts/${id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Like the post
        await axios.post(
          `http://localhost:5051/posts/${id}/like`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    }
  };

  const handleFollow = async () => {
    // Store previous state for rollback
    const previousIsFollowing = isFollowing;

    // OPTIMISTIC UPDATE - Update UI immediately
    setIsFollowing(!isFollowing);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Rollback if not authenticated
        setIsFollowing(previousIsFollowing);
        navigate("/login");
        return;
      }

      const token = session.access_token;

      if (previousIsFollowing) {
        // Unfollow the user
        await axios.delete(
          `http://localhost:5051/users/${post.User.id}/follow`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Follow the user
        await axios.post(
          `http://localhost:5051/users/${post.User.id}/follow`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Rollback on error
      setIsFollowing(previousIsFollowing);
    }
  };

  const handleShare = () => {
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
        {
          content: newComment.trim(),
          parentId: replyTo || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewComment("");
      setReplyTo(null);

      // ✅ easiest + correct (tree): re-fetch
      await fetchComments();
    } catch (err) {
      console.error("Error creating comment:", err);
      alert("Failed to post comment");
    }
  };

  const handleContactOwner = () => {
    navigate(`/messages?user=${post.User.id}`);
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


  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-container">
          <div className="post-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FiArrowLeft /> Back
            </button>
          </div>

          <div className="post-content-wrapper">
            <div className="post-main-content">
              {/* Title skeleton */}
              <div
                style={{
                  height: "42px",
                  width: "70%",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.08)",
                  marginBottom: "16px",
                }}
              />

              {/* Badges skeleton */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                <div style={{ height: "24px", width: "120px", borderRadius: "999px", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ height: "24px", width: "100px", borderRadius: "999px", background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Description skeleton */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ height: "14px", width: "100%", marginBottom: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ height: "14px", width: "95%", marginBottom: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ height: "14px", width: "85%", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }} />
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="post-sidebar">
              <div
                style={{
                  height: "260px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (The "not found" error UI will not be shown instantly, only after fetchPostFresh sets post to null and the skeleton was already shown.)
  const profileUsername = post?.User?.username;
  const profilePath = profileUsername ? `/profile/${profileUsername}` : null;

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        {/* Header with back button */}
        <div className="post-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>

        <div className="post-content-wrapper">
          {/* Main Content */}
          <div className="post-main-content">
            {/* Title with action buttons on the right */}
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

            {/* Category and Difficulty badges */}
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

            {/* Post Description */}
            <div className="post-description-section">
              <h3 className="description-title">Description:</h3>
              <div className="post-description">{post.description}</div>
            </div>

            {/* Separator */}
            <div className="post-separator"></div>

            {/* Tech Stack ee*/}
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

            {/* Separator */}
            <div className="post-separator"></div>

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="comments-title">Comments ({comments.length})</h3>

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

              {/* Comments List */}
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
                          @{comment.author?.username || "user"}
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

                      {/* Replies */}
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
                                    @{reply.author?.username || "user"}
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
                    <h4 className="author-name">{post.User?.name || "Anonymous"}</h4>
                  </Link>
                ) : (
                  <h4 className="author-name">{post.User?.name || "Anonymous"}</h4>
                )}

                <p className="author-username">@{post.User?.username || "user"}</p>
                <p className="author-bio">{post.User?.bio || "No bio available"}</p>
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

            {/* Related Stats */}
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
