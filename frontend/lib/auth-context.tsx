'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    } catch {
      setUser(null);
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cached =
        typeof window !== 'undefined' ? localStorage.getItem('hms_user') : null;
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('hms_token', res.data.token);
    localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user as User;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('hms_token', res.data.token);
    localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user as User;
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
