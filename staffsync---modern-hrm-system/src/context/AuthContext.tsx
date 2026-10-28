import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee, UserRole } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string; department?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('staffsync_token'));
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setEmployee(res.employee);
      } else {
        setUser(null);
        setEmployee(null);
        localStorage.removeItem('staffsync_token');
        setToken(null);
      }
    } catch {
      setUser(null);
      setEmployee(null);
      localStorage.removeItem('staffsync_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('staffsync_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setEmployee(res.employee);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; department?: string }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.token) {
        localStorage.setItem('staffsync_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setEmployee(res.employee);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('staffsync_token');
    setToken(null);
    setUser(null);
    setEmployee(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    // Fast login as predefined seeded users
    if (targetRole === 'HR') {
      await login('hr@staffsync.com', 'admin123');
    } else if (targetRole === 'Manager') {
      await login('manager.tech@staffsync.com', 'manager123');
    } else {
      await login('pravanshu@gmail.com', 'employee123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        refreshMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
