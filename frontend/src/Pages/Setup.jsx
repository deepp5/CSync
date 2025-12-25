// pages/Setup.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../Components/SetUp/SetUpBox.css";
import Aurora from "../Components/LandingPage/Aurora.jsx";

function normalizeUsername(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export default function Setup() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load session safely (works for OAuth redirects)
  useEffect(() => {
    let isMounted = true;

    async function load() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      const session = data?.session;

      if (error || !session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const u = session.user;
      setUser(u);

      const meta = u.user_metadata || {};
      const metaUsername = meta.username;
      const metaSchool = meta.school;

      // ✅ If already completed → go home
      if (metaUsername && metaSchool) {
        navigate("/home", { replace: true });
        return;
      }

      // Optional: prefill if any exists
      if (metaUsername) setUsername(metaUsername);
      if (metaSchool) setSchool(metaSchool);
    }

    load();

    // keep user updated if auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!isMounted) return;
      setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername || cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (!school.trim()) {
      setError("School is required.");
      setLoading(false);
      return;
    }

    // ✅ Store in Supabase auth metadata (no profiles table)
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { username: cleanUsername, school: school.trim() },
    });

    if (metaErr) {
      setError(metaErr.message);
      setLoading(false);
      return;
    }

    // ✅ Refresh session so new metadata is immediately available
    await supabase.auth.refreshSession();

    navigate("/home", { replace: true });
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <Aurora
        colorStops={["#fa4efd", "#9172f8", "#21daf2"]}
        blend={0.5}
        amplitude={1.15}
        speed={0.6}
      />

      <div className="setup-clear-box">
        <h2 className="setup-title">Finish setting up your account</h2>

        <form onSubmit={handleSetup} className="setup-form">
          <div className="setup-input-group">
            <label>Username</label>
            <input
              type="text"
              className="setup-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              disabled={loading}
            />
          </div>

          <div className="setup-input-group">
            <label>School</label>
            <input
              type="text"
              className="setup-input"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Enter your school name"
              required
              disabled={loading}
            />
          </div>

          <div className="setup-submit">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
