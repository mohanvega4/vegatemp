import { useAuth } from "@/hooks/use-new-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  roles = ['admin', 'employee', 'customer', 'provider'], // Default: allow all roles
  requireProfile = false, // Whether this route requires a profile
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: Array<'admin' | 'employee' | 'customer' | 'provider'>;
  requireProfile?: boolean;
}) {
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  // Loading state
  if (isLoading || (user && requireProfile && isProfileLoading)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Role check
  if (!roles.includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Unauthorized Access</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <Redirect to="/" />
        </div>
      </Route>
    );
  }
  
  // Profile check
  if (requireProfile && !profile) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold text-amber-600 mb-2">Profile Required</h1>
          <p className="text-gray-600 mb-6">You need to complete your profile before accessing this page.</p>
          <Redirect to="/profile/create" />
        </div>
      </Route>
    );
  }

  // All checks passed, render the component
  return <Route path={path} component={Component} />;
}