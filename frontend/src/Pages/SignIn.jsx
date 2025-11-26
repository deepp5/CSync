import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/SignIn/SignInBox";
import { supabase } from "../supabaseClient";

export default function SignIn() {
  const [message, setMessage] = useState("");

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/auth/callback", // where Supabase sends user after login
      },
    });

    if (error) {
      console.error(error);
      setMessage("Failed to sign in with Google!");
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

      {/* Your existing sign-in card */}
      <SignInBox />

      {/* Google Login Button */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={loginWithGoogle}
          style={{
            padding: "12px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔥 Continue with Google
        </button>
      </div>

      {message && (
        <p style={{ textAlign: "center", marginTop: "10px" }}>{message}</p>
      )}
    </div>
  );
}
