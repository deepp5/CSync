import React, { useState } from "react";
import colorLogo from "../../assets/colorCSync.png";
import "./SignUpBox.css";
import { Link } from "react-router-dom";
import show from "../../assets/ShowPasswordWhite.png";
import hide from "../../assets/HidePasswordWhite.png";

export default function SignUpBox({ onSubmit, onGoogle, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    school: "",
    receiveUpdates: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  const validateField = (fieldName) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case "email":
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          delete newErrors.password;
        }
        break;

      case "username":
        if (!formData.username.trim()) {
          newErrors.username = "Username is required";
        } else if (formData.username.length < 3) {
          newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
          newErrors.username = "Username can only contain letters, numbers, and underscores";
        } else {
          delete newErrors.username;
        }
        break;

      case "school":
        if (!formData.school.trim()) {
          newErrors.school = "School name is required";
        } else {
          delete newErrors.school;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.school.trim()) {
      newErrors.school = "School name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      username: true,
      school: true,
    });

    if (!validateForm()) return;
    
    onSubmit(formData);
  };

  const handleGoogleSignUp = () => {
    // Mark username and school as touched
    setTouched((prev) => ({
      ...prev,
      username: true,
      school: true,
    }));

    // Validate username and school before allowing Google sign-up
    const googleErrors = {};
    
    if (!formData.username.trim()) {
      googleErrors.username = "Please enter a username before continuing with Google";
    } else if (formData.username.length < 3) {
      googleErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      googleErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.school.trim()) {
      googleErrors.school = "Please enter your school before continuing with Google";
    }

    if (Object.keys(googleErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...googleErrors }));
      return;
    }

    // If validation passes, proceed with Google sign-up
    onGoogle({ username: formData.username, school: formData.school });
  };

  return (
    <div className="signup-page-container">
      <div className="signup-clear-box">
        <Link to="/" className="back-box">
          ← Back
        </Link>
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
              onBlur={() => handleBlur("email")}
              disabled={loading}
            />
            {touched.email && errors.email && (
              <small className="error-message">{errors.email}</small>
            )}
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label>Password*</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="signup-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={() => handleBlur("password")}
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <img 
                  src={showPassword ? hide : show}
                  alt={showPassword ? "Hide Password" : "Show Password"}
                />
              </button>
            </div>
            {touched.password && errors.password && (
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
              onBlur={() => handleBlur("username")}
              disabled={loading}
            />
            {touched.username && errors.username && (
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
              onBlur={() => handleBlur("school")}
              disabled={loading}
            />
            {touched.school && errors.school && (
              <small className="error-message">{errors.school}</small>
            )}
          </div>

          {/* Submit */}
          <div className="signup-submit">
            <button type="submit" className="signup-launch-btn" disabled={loading}>
              <span className="launch-icon">🚀</span>
              <span>{loading ? "Creating..." : "Create Account"}</span>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="or">
          <p>or</p>
        </div>

        {/* GOOGLE BUTTON */}
        <div className="google-login-container">
          <button onClick={handleGoogleSignUp} className="google-login-btn" disabled={loading}>
            <div className="google-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
              </svg>
            </div>
            <span className="btn-text">Continue with Google</span>
          </button>
        </div>

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