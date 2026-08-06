import React from 'react';
import { Navigate } from 'react-router-dom';
import { ACCESS_TOKEN_KEY } from '@app/core/constants/constant';
import type { PageRoute } from './router.interface';

interface PrivateRouteProps {
  component: NonNullable<PageRoute['element']>;
}

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return !!token;
};

export const PrivateRoute = ({ component: Wrapped }: PrivateRouteProps) => {
  return isAuthenticated() ? <Wrapped /> : <Navigate to="/auth/login" />;
};
