// pages/SignIn.jsx
import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/Registration/SignInBox";
import { supabase } from "../supabaseClient";
import axios from "axios";

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

      // 🔑 Sync user into Prisma after login (optional but good)
      // (Only run if you actually have this endpoint)
      if (data?.session?.access_token) {
        await axios.post(
          "http://localhost:5051/auth/sync",
          {},
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
      }

      // ✅ Decide where to go based on metadata
      const meta = data?.user?.user_metadata || {};
      const done = Boolean(meta.username && meta.school);

      setMessage("✅ Login successful!");
      window.location.href = done ? "/home" : "/setup";
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
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
