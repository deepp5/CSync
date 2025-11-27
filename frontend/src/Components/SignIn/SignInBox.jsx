import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignInBox.css";

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
      </div>
    </div>
  );
}
