// client/src/components/AdminRoute.js
// UPDATED - Supports admin and owner roles

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children, allowedRoles = ["admin"] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has allowed role
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default AdminRoute;