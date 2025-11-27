import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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
    <div style={{ padding: 40 }}>
      <h2>Finish setting up your account</h2>

      <form onSubmit={handleSetup}>
        {/* Username */}
        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <br />
        <br />

        {/* School */}
        <label>School</label>
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
        />

        <br />
        <br />

        <button disabled={loading}>{loading ? "Saving..." : "Continue"}</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
