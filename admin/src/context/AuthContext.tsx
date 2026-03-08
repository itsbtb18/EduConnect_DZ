/**
 * Authentication context — manages JWT tokens and current user state.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';

interface User {
  id: string;
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school: string | null;
  school_detail?: { id: string; name: string; subdomain: string; subscription_plan: string } | null;
  photo: string | null;
  is_first_login: boolean;
  is_active: boolean;
  // Convenience getters added after fetch
  school_name?: string;
  subscription_plan?: string;
}

/** Operational roles that can access the admin panel */
export type OperationalRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SECTION_ADMIN'
  | 'GENERAL_SUPERVISOR'
  | 'FINANCE_MANAGER'
  | 'LIBRARIAN'
  | 'CANTEEN_MANAGER'
  | 'TRANSPORT_MANAGER'
  | 'HR_MANAGER'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  /** The operational role of the current user */
  operationalRole: OperationalRole;
  activeModules: string[];
  login: (phone_number: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

/** Decode the payload of a JWT (no verification — just read claims). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const { data } = await authAPI.me();
      // Add convenience fields from school_detail
      data.school_name = data.school_detail?.name || '';
      data.subscription_plan = data.school_detail?.subscription_plan || '';
      setUser(data);

      // Extract active_modules from JWT payload
      const payload = decodeJwtPayload(token);
      setActiveModules(Array.isArray(payload.active_modules) ? payload.active_modules as string[] : []);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (phone_number: string, password: string) => {
    const { data } = await authAPI.login(phone_number, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    await fetchUser();
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.logout(refresh);
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN' || user?.role === 'SECTION_ADMIN';
  const operationalRole: OperationalRole = (user?.role as OperationalRole) || 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin,
        isAdmin,
        operationalRole,
        activeModules,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
