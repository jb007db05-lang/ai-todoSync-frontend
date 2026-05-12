import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/Loader';

interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader center />;
  }

  if (user == null) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;