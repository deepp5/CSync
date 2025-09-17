import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import LoginForm from "../Components/SignIn/SignUpBox";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setMessage("✅ Account created successfully!");
      } else {
        setMessage(data.message || "❌ Signup failed");
      }
    } catch (err) {
      setMessage("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  ``;

  return (
    <div>
      <Aurora
        colorStops={["#fa4efd", "#9172f8", "#21daf2"]}
        blend={0.5}
        amplitude={1.15}
        speed={0.6}
      />

      {}
      <LoginForm onSubmit={handleSubmit} loading={loading} />

      {message && <p>{message}</p>}
    </div>
  );
}
