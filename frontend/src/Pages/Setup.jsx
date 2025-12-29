import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Aurora from "../Components/LandingPage/Aurora";

function normalizeUsername(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 24);
}

export default function Setup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      if (!u) {
        navigate("/login", { replace: true });
        return;
      }

      const meta = u.user_metadata || {};
      if (meta.username && meta.school) {
        navigate("/home", { replace: true });
        return;
      }

      setUser(u);
      if (meta.username) setUsername(meta.username);
      if (meta.school) setSchool(meta.school);
    });
  }, [navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const clean = normalizeUsername(username);

    if (!clean || !school.trim()) {
      setError("All fields required");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { username: clean, school: school.trim() },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.refreshSession();
    navigate("/home", { replace: true });
  };

  if (!user) return null;

  return (
    <div>
      <Aurora />
      <form onSubmit={handleSetup}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <input value={school} onChange={(e) => setSchool(e.target.value)} />
        <button disabled={loading}>Continue</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
