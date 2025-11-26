import useAuth from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = useAuth();

  if (user === null) {
    return <Navigate to="/signin" />;
  }

  return children;
}
