import React, { createContext, useState, type ReactNode } from 'react';
import { User } from '../models/user';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUserSession: (user: User) => void;
  clearUserSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setUserSession = (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
  };

  const clearUserSession = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext
      value={{ user, isAuthenticated, setUserSession, clearUserSession }}
    >
      {children}
    </AuthContext>
  );
};
