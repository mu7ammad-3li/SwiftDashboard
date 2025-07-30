// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element; // Expect a single JSX element as children
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner/page while checking auth state
    return <div>Loading Authentication...</div>; // Or a proper loading component
  }

  if (!currentUser) {
    // User is not logged in, redirect to sign-in page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // User is logged in, render the requested component
  return children;
};

export default ProtectedRoute;
