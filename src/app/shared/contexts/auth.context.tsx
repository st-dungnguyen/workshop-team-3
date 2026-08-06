import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { AuthErrorCode, AuthStatus } from '../models/auth';

export type { AuthErrorCode, AuthStatus };

export interface AuthContextType {
  authStatus: AuthStatus;
  authError: AuthErrorCode | null;
  token: string | null;
  retryCount: number;
  setLoading: () => void;
  setTokenValidated: (token: string) => void;
  setAuthError: (code: AuthErrorCode) => void;
  retry: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authError, setAuthErrorState] = useState<AuthErrorCode | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const setLoading = useCallback(() => {
    setAuthStatus('loading');
    setAuthErrorState(null);
  }, []);

  const setTokenValidated = useCallback((validated: string) => {
    setToken(validated);
    setAuthStatus('authenticated');
    setAuthErrorState(null);
  }, []);

  const setAuthError = useCallback((code: AuthErrorCode) => {
    setAuthStatus('error');
    setAuthErrorState(code);
  }, []);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <AuthContext
      value={{
        authStatus,
        authError,
        token,
        retryCount,
        setLoading,
        setTokenValidated,
        setAuthError,
        retry,
      }}
    >
      {children}
    </AuthContext>
  );
};
