import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/SignIn/SignInBox";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setMessage("✅ Login successful!");
        // window.location.href = "/dashboard"; // optional redirect
      } else {
        setMessage(data.message || "❌ Login failed");
      }
    } catch (err) {
      setMessage("⚠️ Something went wrong. Please try again.");
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

      {}
      <form onSubmit={handleSubmit}>
        <SignInBox
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
