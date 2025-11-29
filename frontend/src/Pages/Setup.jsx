import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../Components/SetUp/SetUpBox.css"
import Aurora from "../Components/LandingPage/Aurora.jsx"

export default function Setup() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // 1. Load the authenticated user
  // -----------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      const loggedInUser = data.user;
      setUser(loggedInUser);

      // Check if profile already completed
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", loggedInUser.id)
        .maybeSingle();

      if (existingProfile) {
        window.location.href = "/home";
      }
    }

    loadUser();
  }, []);

  // -----------------------------
  // 2. Save username + school
  // -----------------------------
  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanUsername = username.toLowerCase();

    // Step A: check if username taken
    const { data: nameCheck } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", cleanUsername);

    if (nameCheck && nameCheck.length > 0) {
      setError("❌ Username already taken!");
      setLoading(false);
      return;
    }

    // Step B: update auth metadata
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { username: cleanUsername, school },
    });

    if (metaErr) {
      setError(metaErr.message);
      setLoading(false);
      return;
    }

    // Step C: insert into profiles
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: user.id,
      username: cleanUsername,
      school,
      // ❌ removed email because it doesn't exist in table
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    // Step D: redirect to home
    window.location.href = "/home";
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
            {/* Username */}
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

            {/* School */}
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
