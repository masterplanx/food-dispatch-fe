

'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import type { User, AuthResponse, Tenant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTenant: (tenant: Tenant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const expiresAt = localStorage.getItem('expires_at');

    if (storedUser && expiresAt && new Date(expiresAt) > new Date()) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Handle both PascalCase (from Go backend) and camelCase
      setTenant(parsedUser.Tenant || parsedUser.tenant);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('expires_at');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/') {
        router.push('/');
      } else if (user && pathname === '/') {
        router.push('/dashboard');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, pathname]);

  const setAuthData = useCallback((data: AuthResponse) => {
    // Handle both PascalCase (from Go backend) and camelCase
    const userTenant = (data.user as any).Tenant || data.user.tenant;
    setUser(data.user);
    setTenant(userTenant);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('expires_at', data.expires_at);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    setAuthData(response.data);
  }, [setAuthData]);

  const register = useCallback(async (data: any) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    setAuthData(response.data);
  }, [setAuthData]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout failed, but clearing client-side session anyway.', error);
    } finally {
      setUser(null);
      setTenant(null);
      localStorage.removeItem('user');
      localStorage.removeItem('expires_at');
      router.push('/');
    }
  }, [router]);

  const handleSetTenant = useCallback((newTenant: Tenant) => {
    setTenant(newTenant);
    setUser((prevUser) => {
      if (prevUser) {
        const updatedUser = { ...prevUser, tenant: newTenant };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return prevUser;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    tenant,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
    setTenant: handleSetTenant,
  }), [user, tenant, login, register, logout, isLoading, handleSetTenant]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Skeleton className="h-20 w-20 rounded-full" />
        </div>
    );
  }


  return (
    <AuthContext.Provider value={value}>
      {(pathname === '/' || user) ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
