import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/Registration/SignInBox";
import { supabase } from "../supabaseClient";

export default function SignIn() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithEmail = async ({ email, password }) => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
        return;
      }

      const meta = data.user.user_metadata || {};
      const done = meta.username && meta.school;

      window.location.href = done ? "/home" : "/setup";
    } catch {
      setMessage("⚠️ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/setup`,
      },
    });
  };

  return (
    <div>
      <Aurora />
      <SignInBox
        onSubmit={loginWithEmail}
        onGoogle={loginWithGoogle}
        loading={loading}
      />
      {message && <p style={{ textAlign: "center" }}>{message}</p>}
    </div>
  );
}
