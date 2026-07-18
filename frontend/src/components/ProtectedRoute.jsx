import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './UI';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin' && user?.email !== 'shivashankrmali7@gmail.com' && !user?.email?.includes('admin')) return <Navigate to="/dashboard" replace />;

  return children;
}

export function PublicRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  if (user) {
    if (profile?.role === 'admin' || user?.email === 'shivashankrmali7@gmail.com' || user?.email?.includes('admin')) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export function RootRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  if (user) {
    if (profile?.role === 'admin' || user?.email === 'shivashankrmali7@gmail.com' || user?.email?.includes('admin')) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}
