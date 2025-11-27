import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import LoginForm from "../Components/SignIn/SignUpBox";
import { supabase } from "../supabaseClient";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (formData) => {
    setLoading(true);
    setMessage("");

    const { email, password, username, school } = formData;

    try {
      // --- Supabase signup ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            school,
          },
        },
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
        return;
      }

      // --- EMAIL CONFIRMATION MODE ---
      if (data?.user && !data.session) {
        setMessage("📬 Check your email to confirm your account!");

        // Redirect to login after 1.5 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return;
      }

      // --- AUTO-LOGIN MODE (if email confirmations OFF) ---
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

  return (
    <div>
      <Aurora
        colorStops={["#fa4efd", "#9172f8", "#21daf2"]}
        blend={0.5}
        amplitude={1.15}
        speed={0.6}
      />

      <LoginForm onSubmit={handleSignup} loading={loading} />

      {message && (
        <p style={{ textAlign: "center", marginTop: "12px" }}>{message}</p>
      )}
    </div>
  );
}
