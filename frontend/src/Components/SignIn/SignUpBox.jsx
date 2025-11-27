import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignUpBox.css";
import { Link } from "react-router-dom";

export default function LoginForm({ onSubmit, onGoogle, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    school: "",
    receiveUpdates: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.school.trim()) newErrors.school = "School is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <div className="signup-page-container">
      <div className="signup-clear-box">
        <div className="signup-logo-container">
          <img src={colorLogo} alt="Logo" />
          <h3 className="signup-title">Create your CSync account</h3>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="signup-input-group">
            <label>Email*</label>
            <input
              type="email"
              name="email"
              className="signup-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.email && (
              <small className="error-message">{errors.email}</small>
            )}
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label>Password*</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="signup-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

            {errors.password && (
              <small className="error-message">{errors.password}</small>
            )}
          </div>

          {/* Username */}
          <div className="signup-input-group">
            <label>Username*</label>
            <input
              type="text"
              name="username"
              className="signup-input"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.username && (
              <small className="error-message">{errors.username}</small>
            )}
          </div>

          {/* School */}
          <div className="signup-input-group">
            <label>School*</label>
            <input
              type="text"
              name="school"
              className="signup-input"
              placeholder="Enter your school"
              value={formData.school}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.school && (
              <small className="error-message">{errors.school}</small>
            )}
          </div>

          {/* Checkbox */}
          <div className="signup-checkbox">
            <label>
              <input
                type="checkbox"
                name="receiveUpdates"
                checked={formData.receiveUpdates}
                onChange={handleInputChange}
                disabled={loading}
              />
              Receive product updates
            </label>
          </div>

          {/* Submit */}
          <div className="signup-submit">
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Sign up"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="or">
          <p>or</p>
        </div>

        {/* GOOGLE BUTTON */}
        <button onClick={onGoogle} className="google-login-btn">
          <div className="google-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54..." />
              <path fill="#4285F4" d="M46.98 24.55..." />
              <path fill="#FBBC05" d="M10.53 28.59..." />
              <path fill="#34A853" d="M24 48c6.48..." />
            </svg>
          </div>
          <span className="btn-text">Continue with Google</span>
        </button>
        <p className="auth-toggle-text">
          Already have an account?
          <Link to="/login" className="auth-toggle-link">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
