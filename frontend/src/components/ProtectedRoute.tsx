import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types/auth.types';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Staff and Owner must use their own portals — not customer routes
  if (user?.role === Role.STAFF) return <Navigate to="/staff" replace />;
  if (user?.role === Role.OWNER) return <Navigate to="/admin" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
