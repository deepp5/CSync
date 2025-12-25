// pages/SignUp.jsx
import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import LoginForm from "../Components/Registration/SignUpBox";
import { supabase } from "../supabaseClient";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (formData) => {
    setLoading(true);
    setMessage("");

    const { email, password, username, school } = formData;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, school },
        },
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      // email confirm mode
      if (data?.user && !data.session) {
        setMessage("📬 Check your email to confirm your account!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        setLoading(false);
        return;
      }

      // auto login mode
      if (data?.session) {
        setMessage("🎉 Account created! Redirecting...");
        const meta = data.session.user.user_metadata || {};
        const done = meta.username && meta.school;
        window.location.href = done ? "/home" : "/setup";
        try {
          const accessToken = data.session.access_token;

          await fetch("http://localhost:5051/auth/sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          setMessage("🎉 Account created! Redirecting...");
          window.location.href = "/home";
        } catch (syncErr) {
          console.error("Auth sync failed:", syncErr);
          setMessage("⚠️ Account created, but failed to sync profile.");
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/setup`,
      },
    });

    if (error) {
      console.error(error);
      setMessage("❌ Failed to sign up with Google.");
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

      <LoginForm
        onSubmit={handleSignup}
        onGoogle={handleGoogleSignup}
        loading={loading}
      />

      {message && (
        <p style={{ textAlign: "center", marginTop: "12px" }}>{message}</p>
      )}
    </div>
  );
}
