import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@shared/contexts/auth.context';
import type { PageRoute } from './router.interface';

interface PrivateRouteProps {
  component: NonNullable<PageRoute['element']>;
}

export const PrivateRoute = ({ component: Wrapped }: PrivateRouteProps) => {
  const { authStatus } = useAuth();
  return authStatus === 'authenticated' ? (
    <Wrapped />
  ) : (
    <Navigate to="/" replace />
  );
};
