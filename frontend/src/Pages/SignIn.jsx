import React, { useState } from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/SignIn/SignIn";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setMessage("Login successful!");
        // ✅ redirect to dashboard or home
        // window.location.href = "/dashboard";
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
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

      {/* Wrap SignInBox in a form */}
      <form onSubmit={handleSubmit}>
        <SignInBox
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        <button type="submit">Sign In</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
