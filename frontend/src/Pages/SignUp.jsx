import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import LoginForm from "../Components/Registration/SignUpBox";
import { supabase } from "../supabaseClient";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async ({ email, password, username, school }) => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, school },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage("📬 Check your email to confirm!");
      return;
    }

    window.location.href = "/home";
  };

  const handleGoogleSignup = async () => {
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
      <LoginForm
        onSubmit={handleSignup}
        onGoogle={handleGoogleSignup}
        loading={loading}
      />
      {message && <p style={{ textAlign: "center" }}>{message}</p>}
    </div>
  );
}
