import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * @param {React.ReactNode} children - The protected page component
 * @param {string|string[]} roles - Allowed roles (e.g., 'guard', ['admin', 'guard'])
 *
 * Behavior:
 * - If still loading stored session → show a spinner
 * - If not authenticated → redirect to /login (preserves intended URL via `state`)
 * - If authenticated but wrong role → redirect to their default dashboard
 * - If authorized → render children
 */
const ROLE_DEFAULT_ROUTES = {
  admin: '/admin/dashboard',
  guard: '/guard/scan',
  resident: '/resident/dashboard',
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading GuardTrack…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (roles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate default page
    const fallback = ROLE_DEFAULT_ROUTES[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
