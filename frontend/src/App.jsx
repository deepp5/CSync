import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
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

        {/* Required for Google OAuth */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Example protected page — only logged-in users can access */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <h1>Welcome to the dashboard!</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
