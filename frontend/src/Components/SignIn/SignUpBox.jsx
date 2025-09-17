import React, { useState } from "react";

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add validation or backend call here
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "300px", margin: "auto" }}>
      {/* Username Field */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="username" style={{ display: "block", marginBottom: "5px" }}>
          Username or Email
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="Enter your username"
          style={{ width: "100%", padding: "8px" }}
          required
        />
      </div>

      {/* Password Field */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="password" style={{ display: "block", marginBottom: "5px" }}>
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Enter your password"
          style={{ width: "100%", padding: "8px" }}
          required
        />
      </div>

      {/* Submit Button */}
      <button type="submit" style={{ padding: "10px 20px", width: "100%" }}>
        Sign In
      </button>
    </form>
  );
}

export default LoginForm;
