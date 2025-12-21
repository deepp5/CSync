import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import HomePage from "./Pages/HomePage";
import Setup from "./Pages/Setup"; 
import CreatePost from "./Pages/CreatePost";
import AuthCallback from "./Pages/AuthCallback";
import ProtectedRoute from "./Components/ProtectedRoute";
import ProfilePage from "./Pages/ProfilePage"
import MyProjectPage from "./Pages/MyProjectPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-project" element={<CreatePost />} />
        <Route path="/edit-project/:id" element={<CreatePost />} />
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/my-projects" element={<MyProjectPage/>}/>

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

        <Route path="/setup" element={<Setup />} />
      </Routes>
    </Router>
  );
}
