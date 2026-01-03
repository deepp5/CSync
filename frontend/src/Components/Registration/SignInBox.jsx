import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignInBox.css";
import {supabase} from "../../supabaseClient"
import { Link } from "react-router-dom";
import show from "../../assets/ShowPasswordWhite.png";
import hide from "../../assets/HidePasswordWhite.png";

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
  // Submit to parent
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="login-page-container">
      <div className="clear-box-container">
        <Link to="/" className="back-box">
          ← Back
        </Link>
        <div id="logo-container">
          <img src={colorLogo} alt="Logo" />
          <h3 className="title">Sign in to CSync</h3>
        </div>

        {/* EMAIL + PASSWORD FORM */}
        <form className="sign-option" onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="username-container">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="username-signIn"
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

          {/* PASSWORD */}
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

              {/* Toggle password */}
              <button
                type="button"
                className="toggle-password-signin"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <img
                  src={showPassword ? hide : show }
                  alt={showPassword ? "Hide Password" : "Show Password"}
                />
              </button>
           
            </div>

            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* SUBMIT */}
          <div className="submit-container">
            <button type="submit" className="signin-pulse-btn" disabled={loading}>
              <span className="pulse-text">
                {loading ? "Signing in..." : "Sign In"}
              </span>
              <span className="pulse-ring"></span>
            </button>
          </div>
        </form>

        <p className="auth-toggle-text">
            New to CSync? 
            <Link to="/register" className="auth-toggle-link">Create an account</Link>
        </p>

      </div>
    </div>
  );
}
