import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import Sidebar from "../Sidebar/Sidebar";
import Grid from "../HomePage/Grid/Grid";
import { FiEdit2, FiGithub, FiLinkedin, FiMail, FiX, FiCheck, FiMapPin, FiCalendar, FiUsers, FiGrid } from "react-icons/fi";

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
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();

        let token = null;
        let userId = null;

        if (session) {
          token = session.access_token;
          userId = session.user.id;
          setCurrentUserId(userId);
        }

        const profileResponse = await axios.get(
          `http://localhost:5051/api/profile/${username}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        const profileData = profileResponse.data;
        setProfile(profileData);

        setEditForm({
          schoolCompany: profileData?.schoolCompany || "",
          bio: profileData?.bio || "",
          githubUrl: profileData?.githubUrl || "",
          linkedinUrl: profileData?.linkedinUrl || "",
          skills: Array.isArray(profileData?.skills) ? profileData.skills : [],
        });
        setSkillsInput(
          Array.isArray(profileData?.skills) ? profileData.skills.join(", ") : ""
        );

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
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.error || "Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
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

      setIsEditing(false);
    } catch (e) {
      console.error("Save profile failed:", e);
      alert(e.response?.data?.error || "Failed to save profile");
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="ml-[230px] transition-all duration-300 data-[sidebar=false]:ml-[70px] min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
        <div className="ml-[230px] transition-all duration-300 data-[sidebar=false]:ml-[70px] min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-red-400 text-xl">{error || "Profile not found"}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      
      <div className="ml-[230px] transition-all duration-300 data-[sidebar=false]:ml-[70px] min-h-screen bg-[#0a0a0a] text-white">
        {/* Hero Header with Gradient Background */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40 border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.15),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(33,218,242,0.1),transparent_50%)]"></div>
          
          <div className="relative max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar with glow effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-1">
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-5xl lg:text-6xl font-bold bg-gradient-to-br from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {initials}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {profile.name || username}
                </h1>
                <p className="text-cyan-400 text-lg mb-4">@{profile.username}</p>
                
                {isEditing ? (
                  <input
                    className="w-full max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                    value={editForm.schoolCompany}
                    onChange={(e) => setEditForm((p) => ({ ...p, schoolCompany: e.target.value }))}
                    placeholder="School / Company"
                  />
                ) : (
                  profile.schoolCompany && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-white/70 mb-6">
                      <FiMapPin className="text-cyan-400" />
                      <span>{profile.schoolCompany}</span>
                    </div>
                  )
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-center lg:justify-start gap-6 mt-6 mb-8">
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="group hover:scale-105 transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {profile.stats?.followers || 0}
                      </span>
                      <span className="text-white/50 text-sm">Followers</span>
                    </div>
                  </button>

                  <div className="w-px h-8 bg-white/10"></div>

                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="group hover:scale-105 transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {profile.stats?.following || 0}
                      </span>
                      <span className="text-white/50 text-sm">Following</span>
                    </div>
                  </button>

                  <div className="w-px h-8 bg-white/10"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{posts.length}</span>
                    <span className="text-white/50 text-sm">Projects</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                  {isOwnProfile ? (
                    !isEditing ? (
                      <button
                        onClick={startEdit}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                      >
                        <FiEdit2 /> Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-cyan-500/30"
                        >
                          <FiCheck /> Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all flex items-center gap-2"
                        >
                          <FiX /> Cancel
                        </button>
                      </>
                    )
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className={`px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 ${
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
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all hover:scale-110"
                        >
                          <FiGithub className="text-xl" />
                        </a>
                      )}
                      {profile.linkedinUrl && (
                        <a
                          href={profile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all hover:scale-110"
                        >
                          <FiLinkedin className="text-xl" />
                        </a>
                      )}
                      {profile.email && (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                          <FiMail className="text-cyan-400" />
                          <span className="text-sm">{profile.email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Social Links */}
                {isEditing && (
                  <div className="mt-6 space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <FiGithub className="text-cyan-400 text-xl" />
                      <input
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, githubUrl: e.target.value }))}
                        placeholder="GitHub URL"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <FiLinkedin className="text-cyan-400 text-xl" />
                      <input
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
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
            className="bg-[#1a1a1a] border border-white/20 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Followers</h2>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {followers.length ? (
                <div className="space-y-3">
                  {followers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.name || u.username}</div>
                        <div className="text-white/50 text-sm">@{u.username}</div>
                      </div>
                    </div>
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
            className="bg-[#1a1a1a] border border-white/20 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Following</h2>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {following.length ? (
                <div className="space-y-3">
                  {following.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.name || u.username}</div>
                        <div className="text-white/50 text-sm">@{u.username}</div>
                      </div>
                    </div>
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
      `}</style>
    </>
  );
};

export default ProfilePage;





// // profile.jsx - Updated with compact header, modals, and improved UX
// import { useEffect, useMemo, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { supabase } from "../../supabaseClient";
// import Sidebar from "../Sidebar/Sidebar";
// import Grid from "../HomePage/Grid/Grid";
// import "./Profile.css";
// import { FiEdit2, FiGithub, FiLinkedin, FiMail, FiX, FiCheck } from "react-icons/fi";

// const ProfilePage = () => {
//   const { username } = useParams();

//   const [profile, setProfile] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [isOwnProfile, setIsOwnProfile] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [followers, setFollowers] = useState([]);
//   const [following, setFollowing] = useState([]);
//   const [error, setError] = useState(null);

//   // Modal state
//   const [showFollowersModal, setShowFollowersModal] = useState(false);
//   const [showFollowingModal, setShowFollowingModal] = useState(false);

//   // Edit state
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     schoolCompany: "",
//     bio: "",
//     githubUrl: "",
//     linkedinUrl: "",
//     skills: [],
//   });
//   const [skillsInput, setSkillsInput] = useState("");

//   const initials = useMemo(() => {
//     const n = profile?.name || username || "";
//     return n.slice(0, 1).toUpperCase();
//   }, [profile?.name, username]);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const {
//           data: { session },
//         } = await supabase.auth.getSession();

//         let token = null;
//         let userId = null;

//         if (session) {
//           token = session.access_token;
//           userId = session.user.id;
//           setCurrentUserId(userId);
//         }

//         const profileResponse = await axios.get(
//           `http://localhost:5051/api/profile/${username}`,
//           {
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//           }
//         );

//         const profileData = profileResponse.data;
//         setProfile(profileData);

//         setEditForm({
//           schoolCompany: profileData?.schoolCompany || "",
//           bio: profileData?.bio || "",
//           githubUrl: profileData?.githubUrl || "",
//           linkedinUrl: profileData?.linkedinUrl || "",
//           skills: Array.isArray(profileData?.skills) ? profileData.skills : [],
//         });
//         setSkillsInput(
//           Array.isArray(profileData?.skills) ? profileData.skills.join(", ") : ""
//         );

//         const isOwn = userId && profileData.id === userId;
//         setIsOwnProfile(!!isOwn);

//         const postsResponse = await axios.get(
//           `http://localhost:5051/api/profile/${username}/posts`,
//           {
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//           }
//         );
//         setPosts(postsResponse.data || []);

//         if (token && userId && profileData.id !== userId) {
//           const followResponse = await axios.get(
//             `http://localhost:5051/api/profile/${username}/follow-status`,
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );
//           setIsFollowing(!!followResponse.data?.isFollowing);
//         }

//         if (token) {
//           const [followersResponse, followingResponse] = await Promise.all([
//             axios.get(`http://localhost:5051/api/profile/${username}/followers`, {
//               headers: { Authorization: `Bearer ${token}` },
//             }),
//             axios.get(`http://localhost:5051/api/profile/${username}/following`, {
//               headers: { Authorization: `Bearer ${token}` },
//             }),
//           ]);

//           setFollowers(followersResponse.data || []);
//           setFollowing(followingResponse.data || []);
//         }

//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//         setError(err.response?.data?.error || "Failed to load profile");
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [username]);

//   // Close modals on ESC key
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") {
//         setShowFollowersModal(false);
//         setShowFollowingModal(false);
//       }
//     };

//     document.addEventListener("keydown", handleEscape);
//     return () => document.removeEventListener("keydown", handleEscape);
//   }, []);

//   const handleFollowToggle = async () => {
//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (!session) return;

//       const token = session.access_token;

//       if (isFollowing) {
//         await axios.delete(`http://localhost:5051/api/profile/${username}/follow`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setIsFollowing(false);
//         setProfile((prev) => ({
//           ...prev,
//           stats: {
//             ...prev.stats,
//             followers: Math.max(0, (prev.stats?.followers || 0) - 1),
//           },
//         }));
//       } else {
//         await axios.post(
//           `http://localhost:5051/api/profile/${username}/follow`,
//           {},
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         setIsFollowing(true);
//         setProfile((prev) => ({
//           ...prev,
//           stats: {
//             ...prev.stats,
//             followers: (prev.stats?.followers || 0) + 1,
//           },
//         }));
//       }
//     } catch (err) {
//       console.error("Error toggling follow:", err);
//     }
//   };

//   const startEdit = () => {
//     if (!isOwnProfile || !profile) return;
//     setIsEditing(true);
//   };

//   const cancelEdit = () => {
//     if (!profile) return;
//     setIsEditing(false);
//     setEditForm({
//       schoolCompany: profile?.schoolCompany || "",
//       bio: profile?.bio || "",
//       githubUrl: profile?.githubUrl || "",
//       linkedinUrl: profile?.linkedinUrl || "",
//       skills: Array.isArray(profile?.skills) ? profile.skills : [],
//     });
//     setSkillsInput(Array.isArray(profile?.skills) ? profile.skills.join(", ") : "");
//   };

//   const saveEdit = async () => {
//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (!session) return;

//       const token = session.access_token;

//       const skills = skillsInput
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);

//       const payload = {
//         name: profile.name, // Keep existing name, don't allow editing
//         schoolCompany: editForm.schoolCompany,
//         bio: editForm.bio,
//         githubUrl: editForm.githubUrl,
//         linkedinUrl: editForm.linkedinUrl,
//         skills,
//       };

//       const res = await axios.put("http://localhost:5051/api/profile/update", payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const updated = res.data;
//       setProfile((prev) => ({
//         ...prev,
//         ...updated,
//         stats: updated.stats || prev.stats,
//       }));

//       setIsEditing(false);
//     } catch (e) {
//       console.error("Save profile failed:", e);
//       alert(e.response?.data?.error || "Failed to save profile");
//     }
//   };

//   if (loading) {
//     return (
//       <>
//         <Sidebar />
//         <div className="profile-page">
//           <div className="profile-container">
//             <div className="loading-state">Loading profile...</div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (error) {
//     return (
//       <>
//         <Sidebar />
//         <div className="profile-page">
//           <div className="profile-container">
//             <div className="error-state">{error}</div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (!profile) {
//     return (
//       <>
//         <Sidebar />
//         <div className="profile-page">
//           <div className="profile-container">
//             <div className="error-state">Profile not found</div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <Sidebar />

//       <div className="profile-page">
//         <div className="profile-container">
//           {/* Compact Profile Header Card */}
//           <div className="profile-header-card">
//             <div className="profile-header-main">
//               {/* Left: Avatar + Social Links */}
//               <div className="profile-header-left">
//                 <div className="profile-avatar-section">
//                   <div className="profile-avatar">{initials}</div>
                  
//                   {/* Social chips directly under avatar */}
//                   {(profile.githubUrl || profile.linkedinUrl || profile.email || isEditing) && (
//                     <div className="profile-social-compact">
//                       {isEditing ? (
//                         <>
//                           <div className="social-edit-group">
//                             <FiGithub className="social-icon" />
//                             <input
//                               className="edit-input edit-input-social"
//                               value={editForm.githubUrl}
//                               onChange={(e) =>
//                                 setEditForm((p) => ({ ...p, githubUrl: e.target.value }))
//                               }
//                               placeholder="GitHub URL"
//                             />
//                           </div>
//                           <div className="social-edit-group">
//                             <FiLinkedin className="social-icon" />
//                             <input
//                               className="edit-input edit-input-social"
//                               value={editForm.linkedinUrl}
//                               onChange={(e) =>
//                                 setEditForm((p) => ({ ...p, linkedinUrl: e.target.value }))
//                               }
//                               placeholder="LinkedIn URL"
//                             />
//                           </div>
//                         </>
//                       ) : (
//                         <>
//                           {profile.githubUrl && (
//                             <a
//                               href={profile.githubUrl}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="social-chip"
//                             >
//                               <FiGithub />
//                               <span>GitHub</span>
//                             </a>
//                           )}
//                           {profile.linkedinUrl && (
//                             <a
//                               href={profile.linkedinUrl}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="social-chip"
//                             >
//                               <FiLinkedin />
//                               <span>LinkedIn</span>
//                             </a>
//                           )}
//                           {profile.email && (
//                             <div className="social-chip">
//                               <FiMail />
//                               <span>{profile.email}</span>
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Identity */}
//                 <div className="profile-identity">
//                   <h1 className="profile-name">{profile.name || username}</h1>
//                   <p className="profile-username">@{profile.username}</p>

//                   {isEditing ? (
//                     <input
//                       className="edit-input edit-input-role"
//                       value={editForm.schoolCompany}
//                       onChange={(e) =>
//                         setEditForm((p) => ({ ...p, schoolCompany: e.target.value }))
//                       }
//                       placeholder="School / Company"
//                     />
//                   ) : (
//                     profile.schoolCompany && (
//                       <p className="profile-role">{profile.schoolCompany}</p>
//                     )
//                   )}
//                 </div>
//               </div>

//               {/* Right: Stats + Action Button */}
//               <div className="profile-stats-compact">
//                 <button
//                   className="stat-pill"
//                   onClick={() => setShowFollowersModal(true)}
//                 >
//                   <span className="stat-value">{profile.stats?.followers || 0}</span>
//                   <span className="stat-label">Followers</span>
//                 </button>

//                 <button
//                   className="stat-pill"
//                   onClick={() => setShowFollowingModal(true)}
//                 >
//                   <span className="stat-value">{profile.stats?.following || 0}</span>
//                   <span className="stat-label">Following</span>
//                 </button>

//                 <div className="stat-pill">
//                   <span className="stat-value">{posts.length}</span>
//                   <span className="stat-label">Projects</span>
//                 </div>
//               </div>

//               {/* Right: Action button only */}
//               <div className="profile-header-right">
//                 {isOwnProfile ? (
//                   !isEditing ? (
//                     <button className="btn-edit-profile" onClick={startEdit}>
//                       <FiEdit2 /> Edit Profile
//                     </button>
//                   ) : (
//                     <div className="edit-actions-prominent">
//                       <button className="btn-save-prominent" onClick={saveEdit}>
//                         <FiCheck /> Save Changes
//                       </button>
//                       <button className="btn-cancel-prominent" onClick={cancelEdit}>
//                         <FiX /> Cancel
//                       </button>
//                     </div>
//                   )
//                 ) : (
//                   <button
//                     className={`btn-follow ${isFollowing ? "following" : ""}`}
//                     onClick={handleFollowToggle}
//                   >
//                     {isFollowing ? "Following" : "Follow"}
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Bio Section Card */}
//           <div className="info-card">
//             <h2 className="info-card-title">Bio</h2>
//             {isEditing ? (
//               <textarea
//                 className="edit-textarea"
//                 value={editForm.bio}
//                 onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
//                 placeholder="Tell people about yourself..."
//                 rows="4"
//               />
//             ) : (
//               <p className="info-card-content bio-with-newlines">
//                 {profile.bio || "No bio yet."}
//               </p>
//             )}
//           </div>

//           {/* Skills Section Card */}
//           <div className="info-card">
//             <h2 className="info-card-title">Skills</h2>
//             {isEditing ? (
//               <input
//                 className="edit-input"
//                 value={skillsInput}
//                 onChange={(e) => setSkillsInput(e.target.value)}
//                 placeholder="Comma-separated skills (e.g., React, Node, Prisma)"
//               />
//             ) : (
//               <div className="skills-container">
//                 {(profile.skills || []).length ? (
//                   profile.skills.map((skill, idx) => (
//                     <span key={idx} className="skill-chip">
//                       {skill}
//                     </span>
//                   ))
//                 ) : (
//                   <span className="empty-state">No skills yet.</span>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Projects Section */}
//           <div className="projects-section">
//             <h2 className="section-title-large">Projects</h2>
//             {posts.length > 0 ? (
//               <Grid posts={posts} />
//             ) : (
//               <div className="empty-state-panel">No projects yet.</div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Followers Modal */}
//       {showFollowersModal && (
//         <div 
//           className="modal-overlay"
//           onClick={() => setShowFollowersModal(false)}
//         >
//           <div 
//             className="modal-content"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="modal-header">
//               <h2 className="modal-title">Followers</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => setShowFollowersModal(false)}
//                 aria-label="Close modal"
//               >
//                 <FiX />
//               </button>
//             </div>
//             <div className="modal-body">
//               {followers.length ? (
//                 <div className="follow-list">
//                   {followers.map((u) => (
//                     <div key={u.id} className="follow-item">
//                       <div className="follow-item-avatar">
//                         {(u.name || u.username).charAt(0).toUpperCase()}
//                       </div>
//                       <div className="follow-item-info">
//                         <span className="follow-item-name">{u.name || u.username}</span>
//                         <span className="follow-item-username">@{u.username}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="modal-empty-state">No followers yet.</div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Following Modal */}
//       {showFollowingModal && (
//         <div 
//           className="modal-overlay"
//           onClick={() => setShowFollowingModal(false)}
//         >
//           <div 
//             className="modal-content"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="modal-header">
//               <h2 className="modal-title">Following</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => setShowFollowingModal(false)}
//                 aria-label="Close modal"
//               >
//                 <FiX />
//               </button>
//             </div>
//             <div className="modal-body">
//               {following.length ? (
//                 <div className="follow-list">
//                   {following.map((u) => (
//                     <div key={u.id} className="follow-item">
//                       <div className="follow-item-avatar">
//                         {(u.name || u.username).charAt(0).toUpperCase()}
//                       </div>
//                       <div className="follow-item-info">
//                         <span className="follow-item-name">{u.name || u.username}</span>
//                         <span className="follow-item-username">@{u.username}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="modal-empty-state">Not following anyone yet.</div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ProfilePage;