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

    setLoading(false);
    setMessage("Check your email to confirm your account!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div>
      <Aurora />
      <LoginForm
        onSubmit={handleSignup}
        loading={loading}
        message={message}
      />
    </div>
  );
}
