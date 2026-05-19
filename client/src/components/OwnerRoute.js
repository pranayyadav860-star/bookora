// client/src/components/OwnerRoute.js
// Allow both owners and admins to access owner dashboard

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OwnerRoute({ children }) {
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

  // Allow owners AND admins to access owner dashboard
  if (user.role !== "owner" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default OwnerRoute;