import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/Registration/SignInBox";
import { supabase } from "../supabaseClient";
import axios from "axios";

export default function SignIn() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------
  // 1. Email + Password Sign In
  // -------------------------
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

      // 🔑 Sync user into Prisma after login
      await axios.post(
        "http://localhost:5051/auth/sync",
        {},
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      setMessage("✅ Login successful!");
      setTimeout(() => (window.location.href = "/home"), 500);
    } catch (err) {
      setMessage("⚠️ Something went wrong. Try again.");
    }

    setLoading(false);
  };

  // -------------------------
  // 2. Google OAuth Sign In → redirect to /setup
  // -------------------------
  const loginWithGoogle = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/setup",
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

      {/* Your UI card handles both email login + Google login */}
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
