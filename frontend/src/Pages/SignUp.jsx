import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import LoginForm from "../Components/SignIn/SignUpBox";
import { supabase } from "../supabaseClient";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------
  // 1. Manual Email/Password Signup
  // -------------------------
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
        return;
      }

      // EMAIL CONFIRMATION MODE
      if (data?.user && !data.session) {
        setMessage("📬 Check your email to confirm your account!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      // AUTO LOGIN MODE
      if (data?.session) {
        setMessage("🎉 Account created! Redirecting...");
        window.location.href = "/home";
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 2. Google Signup → redirect to /setup
  // -------------------------
  const handleGoogleSignup = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/setup",
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

      {/* Send BOTH handlers to the SignUpBox */}
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
