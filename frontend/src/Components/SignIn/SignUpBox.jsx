import React, { useState } from "react";

import colorLogo from '../../assets/whiteCSync.png'
import "./SignUpBox.css"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    school: '',
    emailPrefs: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ------------------------
  // Input Change Handler
  // ------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ------------------------
  // Validation Rules
  // ------------------------
  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const pass = formData.password;
      const hasNum = /\d/.test(pass);
      const hasLower = /[a-z]/.test(pass);

      if (pass.length < 15) {
        if (!(pass.length >= 8 && hasNum && hasLower)) {
          newErrors.password =
            'Password must be at least 15 characters OR at least 8 with a number and lowercase letter';
        }
      }
    }

    // Username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(formData.username)) {
      newErrors.username =
        'Username may only contain letters, numbers, or single hyphens (no start/end hyphen)';
    }

    // School
    if (!formData.school.trim()) {
      newErrors.school = 'School is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------------
  // Form Submit
  // ------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('Form submitted:', formData);

      // Example backend call (replace with real endpoint)
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   console.log('Signup successful:', data);
      // } else {
      //   const errorData = await response.json();
      //   setErrors({ submit: errorData.message || 'Signup failed' });
      // }
    } catch (error) {
        console.error('Signup error:', error);
        setErrors({ submit: 'Network error. Please try again.' });
    } finally {
        setIsLoading(false);
    }
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
              required
            />
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label htmlFor="password">Password*</label>
            <input
              type="password"
              id="password"
              name="password"
              className="signup-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <small className="signup-hint">
              Password should be at least 15 characters OR at least 8 characters
              including a number and a lowercase letter.
            </small>
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
              required
            />
            <small className="signup-hint">
              Username may only contain alphanumeric characters or single
              hyphens, and cannot begin or end with a hyphen.
            </small>
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
              required
            />
          </div>

          {/* Email Preferences */}
          <div className="signup-checkbox">
            <label>
              <input
                type="checkbox"
                name="receiveUpdates"
                checked={formData.receiveUpdates}
                onChange={handleInputChange}
              />
              Receive occasional product updates and announcements
            </label>
          </div>

          {/* Submit */}
          <div className="signup-submit">
            <button type="submit">Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
}

