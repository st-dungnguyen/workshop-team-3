import React, { type ReactNode } from 'react';
import { Spinner } from '@shared/components/common';
import { useAuth } from '@shared/contexts/auth.context';
import AuthErrorScreen from '../components/AuthErrorScreen';
import useAuthBridge from '../hooks/useAuthBridge';

const AuthGate = ({ children }: { children: ReactNode }) => {
  useAuthBridge();

  const { authStatus, authError, retry } = useAuth();

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <div className="auth-gate-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (authStatus === 'error' && authError) {
    return <AuthErrorScreen errorCode={authError} onRetry={retry} />;
  }

  return <>{children}</>;
};

export default AuthGate;
