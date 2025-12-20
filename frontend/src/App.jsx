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
import ProfilePage from "./Pages/ProfilePage";
import SettingsPage from "./Pages/SettingsPage";
import PostDetailPage from "./Pages/PostDetailPage";
import MessagesPage from "./Pages/MessagesPage";

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
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/post/:id" element={<PostDetailPage/>}/>
        <Route path="/messages" element={<MessagesPage/>}/>

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

        <Route path="/home" element={<HomePage />} />

        <Route path="/setup" element={<Setup />} />
      </Routes>
    </Router>
  );
}
