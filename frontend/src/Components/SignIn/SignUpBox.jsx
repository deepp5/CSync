import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignUpBox.css";

export default function SignUpBox({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    school: "",
    receiveUpdates: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // --------------------------------
  // Handle Input Changes
  // --------------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" })); // clear error while typing
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --------------------------------
  // Validation
  // --------------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";

    if (!formData.password) newErrors.password = "Password is required";

    if (!formData.username.trim()) newErrors.username = "Username is required";

    if (!formData.school.trim()) newErrors.school = "School is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------
  // Submit Handler
  // --------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit(formData); // ⬅️ parent handles Supabase signup
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
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
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
            <label htmlFor="password">Password*</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="signup-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />

              {/* Password visibility toggle */}
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {errors.password && (
              <small className="error-message">{errors.password}</small>
            )}
          </div>

          {/* Username */}
          <div className="signup-input-group">
            <label htmlFor="username">Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              className="signup-input"
              placeholder="Enter your username"
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
            <label htmlFor="school">Your school*</label>
            <input
              type="text"
              id="school"
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

          {/* Email Updates */}
          <div className="signup-checkbox">
            <label>
              <input
                type="checkbox"
                name="receiveUpdates"
                checked={formData.receiveUpdates}
                onChange={handleInputChange}
                disabled={loading}
              />
              Receive occasional product updates and announcements
            </label>
          </div>

          {/* Submit */}
          <div className="signup-submit">
            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
