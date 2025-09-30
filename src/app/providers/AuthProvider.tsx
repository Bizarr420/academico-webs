import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import api, { withTrailingSlash } from '@/app/services/api';
import type { ApiUser, ApiView, AuthResponse, Role, User, View, ViewCode } from '@/app/types';

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

const normalizeViews = (views?: (ApiView | View)[] | null): View[] => {
  if (!Array.isArray(views)) {
    return [];
  }

  return views.map((view) => ({
    id: view.id,
    nombre: view.nombre,
    codigo: view.codigo,
    descripcion: view.descripcion ?? null,
  }));
};

const normalizeUser = (user: ApiUser | User): User => {
  const { role, vistas, ...rest } = user as ApiUser & { vistas?: (ApiView | View)[] };
  return {
    ...rest,
    role: normalizeRole(role),
    vistas: normalizeViews(vistas),
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

  const views = useMemo<ViewCode[]>(() => {
    if (!user) {
      return [];
    }

    return user.vistas.map((view) => view.codigo as ViewCode);
  }, [user]);

  const hasView = useCallback(
    (code: ViewCode) => views.includes(code),
    [views],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      views,
      hasView,
      login,
      logout,
    }),
    [hasView, login, logout, user, views],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
