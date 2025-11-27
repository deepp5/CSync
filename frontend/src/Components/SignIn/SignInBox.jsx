import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignInBox.css";
import {supabase} from "../../supabaseClient"
import { Link } from "react-router-dom";

export default function SignInBox({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // -------------------------
  // Handle Input Change
  // -------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // Validation
  // -------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------
  // Submit to parent (SignIn.jsx)
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      email: formData.email,
      password: formData.password,
    });
  };

  const [message, setMessage] = useState("");
  const loginWithGoogle = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:5173/home", // After OAuth success
        },
      });
  
      if (error) {
        console.error(error);
        setMessage("❌ Failed to sign in with Google.");
      }
    };

  return (
    <div className="login-page-container">
      <div className="clear-box-container">
        <div id="logo-container">
          <img src={colorLogo} alt="Logo" />
          <h3 className="title">Sign in to CSync</h3>
        </div>

        <form className="sign-option" onSubmit={handleSubmit}>
          {/* EMAIL FIELD */}
          <div className="username-container">
            <label htmlFor="email">Email address</label>

            <input
              type="email"
              id="email"
              name="email"
              className="username"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              disabled={loading}
            />

            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* PASSWORD FIELD */}
          <div className="password-container">
            <label htmlFor="password">Password</label>
            

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
           
            </div>

            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="submit-container">
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="or" id="or">
          <p>or</p>
        </div>
        <div className="google-login-container">
            <button onClick={loginWithGoogle} className="google-login-btn">
                {/* Google Icon */}
                <div className="google-icon-wrapper">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon-svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                </div>

                {/* Text */}
                <span className="btn-text">Continue with Google</span>
            </button>

            {/* Optional Message */}
            {message && (
                <p className="login-message">
                    {message}
                </p>
            )}
      </div>

        {message && (
            <p style={{ textAlign: "center", marginTop: "10px" }}>{message}</p>
        )}

        <p className="auth-toggle-text">
            New to CSync? 
            <Link to="/register" className="auth-toggle-link">Create an account</Link>
        </p>

      </div>
    </div>
  );
}
