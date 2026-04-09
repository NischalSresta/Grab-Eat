import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types/auth.types';

const ProtectedAdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only OWNER gets the full admin panel; STAFF has their own portal at /staff
  if (user?.role !== Role.OWNER) {
    if (user?.role === Role.STAFF) return <Navigate to="/staff/orders" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
