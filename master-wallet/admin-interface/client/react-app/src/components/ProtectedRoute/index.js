import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Placeholder for authentication context
// In a real application, this would come from a proper AuthContext
// that manages user login state.
const useAuth = () => {
  // For now, let's simulate an unauthenticated user.
  // This will force a redirect to the login page.
  // Once authentication is implemented, this should return true if logged in.
  const isAuthenticated = false; 
  const loading = false; // Simulate no loading for now

  return { isAuthenticated, loading };
};

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You might want a loading spinner here
    return <div>Loading authentication...</div>;
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}

export default ProtectedRoute;
