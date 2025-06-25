import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SubscriptionRequired from "./SubscriptionRequired";

/**
 * Protected route component that restricts access based on authentication and roles
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} [props.allowedRoles=[]] - Roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { 
    user, 
    userRole, 
    isLoading, 
    isGymOwner, 
    hasActiveSubscription, 
    requiresSubscription 
  } = useAuth();

  // Show loading state
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If not logged in, redirect to login page
  if (!user) {
    toast.error("Please log in to access this page");
    return <Navigate to="/" replace />;
  }

  // If roles are specified and user doesn't have permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/" replace />;
  }

  // Check if user is a gym owner and needs an active subscription
  if (isGymOwner && requiresSubscription && !hasActiveSubscription) {
    // If the route is the billing plans page, allow access
    if (window.location.pathname === '/billing-plans' || window.location.pathname === '/billing') {
      return <>{children}</>;
    }
    
    // Otherwise, show subscription required page
    return <SubscriptionRequired />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;