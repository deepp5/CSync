import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import Sidebar from "../Sidebar/Sidebar";
import Grid from "../HomePage/Grid/Grid";
import "./Profile.css";
import { prefetchCache } from "../../utils/prefetchCache";
import { FiEdit2, FiGithub, FiLinkedin, FiMail, FiX, FiCheck, FiMapPin, FiGrid } from "react-icons/fi";

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

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

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
        const isOwn = userId && profileData.id === userId;
        setIsOwnProfile(!!isOwn);

        const postsResponse = await axios.get(
          `http://localhost:5051/api/profile/${username}/posts`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        setPosts(postsResponse.data || []);

        if (token && userId && profileData.id !== userId) {
          const followResponse = await axios.get(
            `http://localhost:5051/api/profile/${username}/follow-status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsFollowing(!!followResponse.data?.isFollowing);
        }

        if (token) {
          const [followersResponse, followingResponse] = await Promise.all([
            axios.get(`http://localhost:5051/api/profile/${username}/followers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`http://localhost:5051/api/profile/${username}/following`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          setFollowers(followersResponse.data || []);
          setFollowing(followingResponse.data || []);
        }

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
      const { data: { session } } = await supabase.auth.getSession();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: profile.name,
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
        <div className="ml-[230px] lg:data-[sidebar=false]:ml-[70px] max-[768px]:ml-0 transition-all duration-300 min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-0 max-[768px]:">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-white/50 text-lg">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Sidebar />
        <div className="ml-[230px] lg:data-[sidebar=false]:ml-[70px] max-[768px]:ml-0 transition-all duration-300 min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-0 max-[768px]:">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-red-400 text-xl">{error || "Profile not found"}</p>
          </div>
        </div>
      </>
    );
  }

  const followersCount =
    (Array.isArray(followers) ? followers.length : 0) ?? 0;

  const followingCount =
    (Array.isArray(following) ? following.length : 0) ?? 0; 


  return (
    <>
      <Sidebar />
      
      <div className="ml-[230px] lg:data-[sidebar=false]:ml-[70px] max-[768px]:ml-0 transition-all duration-300 min-h-screen bg-[#0a0a0a] text-white pt-0 max-[768px]:">
        {/* Compact Hero Header */}
        <div className="relative bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-cyan-900/30 border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(33,218,242,0.08),transparent_50%)]"></div>
          
          <div className="relative max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              {/* Avatar with animated border */}
              <div className="relative flex-shrink-0">
                <div className="avatar-border-wrap">
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {initials}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left min-w-0">
                <h1 className="text-3xl lg:text-4xl font-bold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {profile.name || username}
                </h1>
                <p className="text-cyan-400 text-base mb-3">@{profile.username}</p>
                
                {isEditing ? (
                  <input
                    className="w-full max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                    value={editForm.schoolCompany}
                    onChange={(e) => setEditForm((p) => ({ ...p, schoolCompany: e.target.value }))}
                    placeholder="School / Company"
                  />
                ) : (
                  profile.schoolCompany && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-white/70 mb-4 text-sm">
                      <FiMapPin className="text-cyan-400" />
                      <span>{profile.schoolCompany}</span>
                    </div>
                  )
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-center lg:justify-start gap-5 mt-4 mb-5">
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="group hover:scale-105 transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {followingCount}
                      </span>
                      <span className="text-white/50 text-sm">Following</span>
                    </div>
                  </button>

                  <div className="w-px h-6 bg-white/10"></div>

                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="group hover:scale-105 transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {followersCount}
                      </span>
                      <span className="text-white/50 text-sm">Followers</span>
                    </div>
                  </button>

                  <div className="w-px h-6 bg-white/10"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{posts.length}</span>
                    <span className="text-white/50 text-sm">Projects</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                  {isOwnProfile ? (
                    !isEditing ? (
                      <button
                        onClick={startEdit}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all hover:scale-110"
                      >
                        <FiEdit2 />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-cyan-500/30 text-sm"
                        >
                          <FiCheck /> Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
                        >
                          <FiX /> Cancel
                        </button>
                      </>
                    )
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className={`px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 text-sm ${
                        isFollowing
                          ? "bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 hover:text-red-400"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}

                  {/* Social Links */}
                  {!isEditing && (
                    <>
                      {profile.githubUrl && (
                        <a
                          href={profile.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all hover:scale-110"
                        >
                          <FiGithub className="text-lg" />
                        </a>
                      )}
                      {profile.linkedinUrl && (
                        <a
                          href={profile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all hover:scale-110"
                        >
                          <FiLinkedin className="text-lg" />
                        </a>
                      )}
                      {profile.email && (
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-sm">
                          <FiMail className="text-cyan-400" />
                          <span className="hidden sm:inline">{profile.email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Social Links */}
                {isEditing && (
                  <div className="mt-4 space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <FiGithub className="text-cyan-400 text-lg" />
                      <input
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, githubUrl: e.target.value }))}
                        placeholder="GitHub URL"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <FiLinkedin className="text-cyan-400 text-lg" />
                      <input
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                        value={editForm.linkedinUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Bio Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
              About
            </h2>
            {isEditing ? (
              <textarea
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people about yourself..."
                rows="4"
              />
            ) : (
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio yet."}
              </p>
            )}
          </div>

          {/* Skills Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
              Skills & Expertise
            </h2>
            {isEditing ? (
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Comma-separated skills (e.g., React, Node, Prisma)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).length ? (
                  profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-full text-cyan-300 text-sm font-medium hover:border-cyan-400/50 transition-colors"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 italic">No skills yet.</span>
                )}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FiGrid className="text-cyan-400" />
              Projects
              <span className="text-white/40 text-lg font-normal">({posts.length})</span>
            </h2>
            {posts.length > 0 ? (
              <Grid posts={posts} />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-white/40 text-lg">No projects yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease]"
          onClick={() => setShowFollowersModal(false)}
        >
          <div
            className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Followers</h2>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {followers.length ? (
                <div className="space-y-3">
                  {followers.map((u) => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.username}`}
                      onClick={() => setShowFollowersModal(false)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#cf40d1] to-[#1696a7] flex items-center justify-center text-lg font-bold flex-shrink-0 text-white">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-white">{u.name || u.username}</div>
                        <div className="text-white/50 text-sm">@{u.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/40">No followers yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease]"
          onClick={() => setShowFollowingModal(false)}
        >
          <div
            className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Following</h2>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {following.length ? (
                <div className="space-y-3">
                  {following.map((u) => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.username}`}
                      onClick={() => setShowFollowingModal(false)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#cf40d1] to-[#1696a7] flex items-center justify-center text-lg font-bold flex-shrink-0 text-white">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-white">{u.name || u.username}</div>
                        <div className="text-white/50 text-sm">@{u.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/40">Not following anyone yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes borderFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .avatar-border-wrap {
          position: relative;
          padding: 2px;
          border-radius: 50%;
          background: linear-gradient(90deg, #cf40d1 0%, #1696a7 50%, #cf40d1 100%);
          background-size: 300% 300%;
          animation: borderFlow 4s linear infinite;
        }
      `}</style>
    </>
  );
};

export default ProfilePage;