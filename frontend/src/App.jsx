import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./Pages/LandingPage";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import HomePage from "./Pages/HomePage";
import Setup from "./Pages/Setup"; // ✅ <-- Import Setup page
import CreatePost from "./Pages/CreatePost";
import AuthCallback from "./Pages/AuthCallback";
import ProtectedRoute from "./Components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/createpost" element={<CreatePost />} />

        {/* Required for Google OAuth */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected example */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <h1>Welcome to the dashboard!</h1>
            </ProtectedRoute>
          }
        />

        {/* 👇 Logged-in home page */}
        <Route path="/home" element={<HomePage />} />

        {/* 👇 NEW → Google login sends users here to create username */}
        <Route path="/setup" element={<Setup />} />
      </Routes>
    </Router>
  );
}
