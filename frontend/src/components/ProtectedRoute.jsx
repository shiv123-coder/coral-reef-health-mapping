import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './UI';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading, isAdmin, isOffline } = useAuth();

  if (loading) return <LoadingSpinner text="Loading session..." />;
  if (isOffline && !isAdmin) return <Navigate to="/maintenance" replace />;
  if (profile?.isActive === false) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

export function PublicRoute({ children }) {
  const { user, profile, loading, isAdmin, isOffline } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isOffline) {
      return <Navigate to="/maintenance" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export function RootRedirect() {
  const { user, profile, loading, isAdmin, isOffline } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isOffline) {
      return <Navigate to="/maintenance" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}
