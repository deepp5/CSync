import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    const handleLogin = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (session) {
        // Save token to localStorage for use with backend
        localStorage.setItem("sb_token", session.access_token);

        // Optional: send user to dashboard
        window.location.href = "/dashboard";
      }
    };

    handleLogin();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>⏳ Signing you in...</h2>
    </div>
  );
}
