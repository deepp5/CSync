// profile.jsx - Updated with compact header, modals, and improved UX
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import Sidebar from "../Sidebar/Sidebar";
import Grid from "../HomePage/Grid/Grid";
import "./Profile.css";
import { FiEdit2, FiGithub, FiLinkedin, FiMail, FiX, FiCheck } from "react-icons/fi";
import { prefetchCache } from "../../utils/prefetchCache";

const ProfilePage = () => {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [error, setError] = useState(null);

  // Modal state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    schoolCompany: "",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    skills: [],
  });
  const [skillsInput, setSkillsInput] = useState("");

  const initials = useMemo(() => {
    const n = profile?.name || username || "";
    return n.slice(0, 1).toUpperCase();
  }, [profile?.name, username]);

  useEffect(() => {
    const cacheKey = `profile:${username}`;

    const fetchFreshProfile = async () => {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || null;
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);

        // Profile
        const profileRes = await axios.get(
          `http://localhost:5051/api/profile/${username}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const profileData = profileRes.data;

        // Posts
        const postsRes = await axios.get(
          `http://localhost:5051/api/profile/${username}/posts`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        // Follow status
        let followingState = false;
        if (token && userId && profileData.id !== userId) {
          const followRes = await axios.get(
            `http://localhost:5051/api/profile/${username}/follow-status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          followingState = !!followRes.data?.isFollowing;
        }

        // Followers / Following
        let followersData = [];
        let followingData = [];
        if (token) {
          const [followersRes, followingRes] = await Promise.all([
            axios.get(
              `http://localhost:5051/api/profile/${username}/followers`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            axios.get(
              `http://localhost:5051/api/profile/${username}/following`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
          ]);
          followersData = followersRes.data || [];
          followingData = followingRes.data || [];
        }

        // Own profile
        const own = userId && profileData.id === userId;

        // Overwrite state after all fetches
        setProfile(profileData);
        setPosts(postsRes.data || []);
        setIsFollowing(followingState);
        setIsOwnProfile(!!own);
        setFollowers(followersData);
        setFollowing(followingData);

        setEditForm({
          schoolCompany: profileData?.schoolCompany || "",
          bio: profileData?.bio || "",
          githubUrl: profileData?.githubUrl || "",
          linkedinUrl: profileData?.linkedinUrl || "",
          skills: Array.isArray(profileData?.skills) ? profileData.skills : [],
        });
        setSkillsInput(
          Array.isArray(profileData?.skills)
            ? profileData.skills.join(", ")
            : ""
        );

        // Cache everything
        prefetchCache.set(cacheKey, {
          profile: profileData,
          posts: postsRes.data || [],
          isFollowing: followingState,
          isOwnProfile: !!own,
          followers: followersData,
          following: followingData,
        });

        setLoading(false);
      } catch (err) {
        console.error("Fresh profile fetch failed:", err);
        setError(err.response?.data?.error || "Failed to load profile");
        setLoading(false);
      }
    };

    const loadProfile = async () => {
      try {
        setError(null);

        // ⚡ Try cache first
        const cached = prefetchCache.get(cacheKey);
        if (cached) {
          setProfile(cached.profile);
          setPosts(cached.posts);
          setIsFollowing(cached.isFollowing);
          setIsOwnProfile(cached.isOwnProfile);
          setFollowers(cached.followers || []);
          setFollowing(cached.following || []);
          setEditForm({
            schoolCompany: cached.profile?.schoolCompany || "",
            bio: cached.profile?.bio || "",
            githubUrl: cached.profile?.githubUrl || "",
            linkedinUrl: cached.profile?.linkedinUrl || "",
            skills: Array.isArray(cached.profile?.skills) ? cached.profile.skills : [],
          });
          setSkillsInput(
            Array.isArray(cached.profile?.skills)
              ? cached.profile.skills.join(", ")
              : ""
          );
          setLoading(false);
          // Silent background refresh (do not await)
          fetchFreshProfile();
          return;
        }

        // No cache → fetch and show loading
        await fetchFreshProfile();
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  // Close modals on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowFollowersModal(false);
        setShowFollowingModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleFollowToggle = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      if (isFollowing) {
        await axios.delete(`http://localhost:5051/api/profile/${username}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: Math.max(0, (prev.stats?.followers || 0) - 1),
          },
        }));
      } else {
        await axios.post(
          `http://localhost:5051/api/profile/${username}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(true);
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: (prev.stats?.followers || 0) + 1,
          },
        }));
      }
      prefetchCache.clear(`profile:${username}`);
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const startEdit = () => {
    if (!isOwnProfile || !profile) return;
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (!profile) return;
    setIsEditing(false);
    setEditForm({
      schoolCompany: profile?.schoolCompany || "",
      bio: profile?.bio || "",
      githubUrl: profile?.githubUrl || "",
      linkedinUrl: profile?.linkedinUrl || "",
      skills: Array.isArray(profile?.skills) ? profile.skills : [],
    });
    setSkillsInput(Array.isArray(profile?.skills) ? profile.skills.join(", ") : "");
  };

  const saveEdit = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: profile.name, // Keep existing name, don't allow editing
        schoolCompany: editForm.schoolCompany,
        bio: editForm.bio,
        githubUrl: editForm.githubUrl,
        linkedinUrl: editForm.linkedinUrl,
        skills,
      };

      const res = await axios.put("http://localhost:5051/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = res.data;
      setProfile((prev) => ({
        ...prev,
        ...updated,
        stats: updated.stats || prev.stats,
      }));

      prefetchCache.clear(`profile:${username}`);
      setIsEditing(false);
    } catch (e) {
      console.error("Save profile failed:", e);
      alert(e.response?.data?.error || "Failed to save profile");
    }
  };

  if (loading && !profile) {
    return (
      <>
        <Sidebar />
        <div className="profile-page">
          <div className="profile-container">
            <div className="loading-state">Loading profile...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Sidebar />
        <div className="profile-page">
          <div className="profile-container">
            <div className="error-state">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Sidebar />
        <div className="profile-page">
          <div className="profile-container">
            <div className="error-state">Profile not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />

      <div className="profile-page">
        <div className="profile-container">
          {/* Compact Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-header-main">
              {/* Left: Avatar + Social Links */}
              <div className="profile-header-left">
                <div className="profile-avatar-section">
                  <div className="profile-avatar">{initials}</div>
                  
                  {/* Social chips directly under avatar */}
                  {(profile.githubUrl || profile.linkedinUrl || profile.email || isEditing) && (
                    <div className="profile-social-compact">
                      {isEditing ? (
                        <>
                          <div className="social-edit-group">
                            <FiGithub className="social-icon" />
                            <input
                              className="edit-input edit-input-social"
                              value={editForm.githubUrl}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, githubUrl: e.target.value }))
                              }
                              placeholder="GitHub URL"
                            />
                          </div>
                          <div className="social-edit-group">
                            <FiLinkedin className="social-icon" />
                            <input
                              className="edit-input edit-input-social"
                              value={editForm.linkedinUrl}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, linkedinUrl: e.target.value }))
                              }
                              placeholder="LinkedIn URL"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {profile.githubUrl && (
                            <a
                              href={profile.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="social-chip"
                            >
                              <FiGithub />
                              <span>GitHub</span>
                            </a>
                          )}
                          {profile.linkedinUrl && (
                            <a
                              href={profile.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="social-chip"
                            >
                              <FiLinkedin />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {profile.email && (
                            <div className="social-chip">
                              <FiMail />
                              <span>{profile.email}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div className="profile-identity">
                  <h1 className="profile-name">{profile.name || username}</h1>
                  <p className="profile-username">@{profile.username}</p>

                  {isEditing ? (
                    <input
                      className="edit-input edit-input-role"
                      value={editForm.schoolCompany}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, schoolCompany: e.target.value }))
                      }
                      placeholder="School / Company"
                    />
                  ) : (
                    profile.schoolCompany && (
                      <p className="profile-role">{profile.schoolCompany}</p>
                    )
                  )}
                </div>
              </div>

              {/* Right: Stats + Action Button */}
              <div className="profile-stats-compact">
                <button
                  className="stat-pill"
                  onClick={() => setShowFollowersModal(true)}
                >
                  <span className="stat-value">{profile.stats?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </button>

                <button
                  className="stat-pill"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <span className="stat-value">{profile.stats?.following || 0}</span>
                  <span className="stat-label">Following</span>
                </button>

                <div className="stat-pill">
                  <span className="stat-value">{posts.length}</span>
                  <span className="stat-label">Projects</span>
                </div>
              </div>

              {/* Right: Action button only */}
              <div className="profile-header-right">
                {isOwnProfile ? (
                  !isEditing ? (
                    <button className="btn-edit-profile" onClick={startEdit}>
                      <FiEdit2 /> Edit Profile
                    </button>
                  ) : (
                    <div className="edit-actions-prominent">
                      <button className="btn-save-prominent" onClick={saveEdit}>
                        <FiCheck /> Save Changes
                      </button>
                      <button className="btn-cancel-prominent" onClick={cancelEdit}>
                        <FiX /> Cancel
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    className={`btn-follow ${isFollowing ? "following" : ""}`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section Card */}
          <div className="info-card">
            <h2 className="info-card-title">Bio</h2>
            {isEditing ? (
              <textarea
                className="edit-textarea"
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people about yourself..."
                rows="4"
              />
            ) : (
              <p className="info-card-content bio-with-newlines">
                {profile.bio || "No bio yet."}
              </p>
            )}
          </div>

          {/* Skills Section Card */}
          <div className="info-card">
            <h2 className="info-card-title">Skills</h2>
            {isEditing ? (
              <input
                className="edit-input"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Comma-separated skills (e.g., React, Node, Prisma)"
              />
            ) : (
              <div className="skills-container">
                {(profile.skills || []).length ? (
                  profile.skills.map((skill, idx) => (
                    <span key={idx} className="skill-chip">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="empty-state">No skills yet.</span>
                )}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="projects-section">
            <h2 className="section-title-large">Projects</h2>
            {posts.length > 0 ? (
              <Grid posts={posts} />
            ) : (
              <div className="empty-state-panel">No projects yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowFollowersModal(false)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Followers</h2>
              <button 
                className="modal-close"
                onClick={() => setShowFollowersModal(false)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {followers.length ? (
                <div className="follow-list">
                  {followers.map((u) => (
                    <div key={u.id} className="follow-item">
                      <div className="follow-item-avatar">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="follow-item-info">
                        <span className="follow-item-name">{u.name || u.username}</span>
                        <span className="follow-item-username">@{u.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modal-empty-state">No followers yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowFollowingModal(false)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Following</h2>
              <button 
                className="modal-close"
                onClick={() => setShowFollowingModal(false)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {following.length ? (
                <div className="follow-list">
                  {following.map((u) => (
                    <div key={u.id} className="follow-item">
                      <div className="follow-item-avatar">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="follow-item-info">
                        <span className="follow-item-name">{u.name || u.username}</span>
                        <span className="follow-item-username">@{u.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modal-empty-state">Not following anyone yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;