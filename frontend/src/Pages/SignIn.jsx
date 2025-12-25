// pages/SignIn.jsx
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
        setLoading(false);
        return;
      }

      const meta = data?.user?.user_metadata || {};
      const done = meta.username && meta.school;

      setMessage("✅ Login successful!");
      window.location.href = done ? "/home" : "/setup";
    } catch (err) {
      setMessage("⚠️ Something went wrong. Try again.");
    }

    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/setup`,
      },
    });

    if (error) {
      console.error(error);
      setMessage("❌ Failed to sign in with Google.");
    }
  };

  return (
    <div>
      <Aurora
        colorStops={["#fa4efd", "#9172f8", "#21daf2"]}
        blend={0.5}
        amplitude={1.15}
        speed={0.6}
      />

      <SignInBox
        onSubmit={loginWithEmail}
        onGoogle={loginWithGoogle}
        loading={loading}
      />

      {message && (
        <p style={{ textAlign: "center", marginTop: "10px" }}>{message}</p>
      )}
    </div>
  );
}
