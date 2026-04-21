import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/Loader';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

function PublicRoute({ children, redirectTo = '/' }: PublicRouteProps): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader center />;
  }

  if (user != null) {
    return <Navigate replace to={redirectTo} />;
  }

  return <>{children}</>;
}

export default PublicRoute;
