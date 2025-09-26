import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import api, { withTrailingSlash } from '@/app/services/api';
import type { ApiUser, AuthResponse, Role, User } from '@/app/types';

import { AuthContext } from './AuthContext';

type AuthProviderProps = {
  children: ReactNode;
};

const normalizeRole = (role: ApiUser['role'] | Role | string): Role => {
  const normalized = `${role}`.toLowerCase();
  if (normalized === 'admin' || normalized === 'administrador') {
    return 'admin';
  }
  if (normalized === 'docente') {
    return 'docente';
  }
  if (normalized === 'padre') {
    return 'padre';
  }

  console.warn(`Rol desconocido recibido: ${role}. Se usará "admin" por defecto.`);
  return 'admin';
};

const normalizeUser = (user: ApiUser | User): User => {
  const { role, ...rest } = user;
  return {
    ...rest,
    role: normalizeRole(role),
  };
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ApiUser | User;
        const normalizedUser = normalizeUser(parsed);
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } catch (error) {
        console.error('Failed to parse saved user from storage', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const { data } = await api.post<AuthResponse>(
      withTrailingSlash('/auth/login'),
      formData,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
    const normalizedUser = normalizeUser(data.user);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
