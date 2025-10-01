import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { authLogin, authLogout, fetchCurrentUser } from '@/app/services/auth';
import type { ApiUser, ApiView, Role, User, View, ViewCode } from '@/app/types';
import { normalizeRole } from '@/app/utils/roles';
import { normalizeViews } from '@/app/utils/views';

import { AuthContext } from './AuthContext';

type AuthProviderProps = {
  children: ReactNode;
};

const normalizeUser = (user: ApiUser | User): User => {
  const { role, roles, vistas, name, username, email, ...rest } = user as ApiUser & {
    vistas?: (ApiView | View)[];
    roles?: (Role | string | null | undefined)[] | null;
    username?: string | null;
    email?: string | null;
    name?: string | null;
  };

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';
  const displayName = trimmedName || trimmedUsername || 'Usuario';

  const normalizedRole = normalizeRole(role);
  const normalizedRolesSet = new Set<Role>();

  if (Array.isArray(roles)) {
    roles.forEach((value) => {
      const normalized = normalizeRole(value ?? undefined);
      if (normalized) {
        normalizedRolesSet.add(normalized);
      }
    });
  }

  if (normalizedRole) {
    normalizedRolesSet.add(normalizedRole);
  }

  const normalizedRoles = Array.from(normalizedRolesSet);

  return {
    ...rest,
    name: displayName,
    username: trimmedUsername || null,
    email: typeof email === 'string' ? email : null,
    role: normalizedRole ?? normalizedRoles[0] ?? null,
    roles: normalizedRoles,
    vistas: normalizeViews(vistas),
  };
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const fallbackTimeoutIdRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const persistUser = useCallback((value: User | null) => {
    setUser(value);
    if (value) {
      localStorage.setItem('user', JSON.stringify(value));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      if (!current) {
        persistUser(null);
        return null;
      }

      const normalized = normalizeUser(current);
      persistUser(normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to refresh authenticated user', error);
      persistUser(null);
      return null;
    }
  }, [persistUser]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const clearFallbackTimeout = () => {
      if (fallbackTimeoutIdRef.current !== null) {
        window.clearTimeout(fallbackTimeoutIdRef.current);
        fallbackTimeoutIdRef.current = null;
      }
    };

    let active = true;

    const startFallbackTimeout = () => {
      clearFallbackTimeout();
      fallbackTimeoutIdRef.current = window.setTimeout(() => {
        if (active) {
          setIsLoading(false);
        }
      }, 6000);
    };

    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ApiUser | User;
        const normalizedUser = normalizeUser(parsed);
        persistUser(normalizedUser);
      } catch (error) {
        console.error('Failed to parse saved user from storage', error);
        localStorage.removeItem('user');
      }
    }

    startFallbackTimeout();
    const initialize = async () => {
      try {
        await refreshUser();
      } finally {
        if (active) {
          clearFallbackTimeout();
          setIsLoading(false);
        }
      }
    };

    initialize().catch((error) => {
      console.error('Failed to initialize authentication', error);
      if (active) {
        clearFallbackTimeout();
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      clearFallbackTimeout();
      hasInitializedRef.current = false;
    };
  }, [persistUser, refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      try {
        await authLogin(username, password);
        const refreshed = await refreshUser();
        if (!refreshed) {
          throw new Error('No se pudo obtener el usuario autenticado.');
        }
      } catch (error) {
        persistUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [persistUser, refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch (error) {
      console.warn('Failed to notify backend about logout', error);
    } finally {
      persistUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate, persistUser]);

  const views = useMemo<ViewCode[]>(() => {
    if (!user) {
      return [];
    }

    return user.vistas.map((view) => view.codigo as ViewCode);
  }, [user]);

  const roles = useMemo<Role[]>(() => (user ? user.roles : []), [user]);

  const hasView = useCallback(
    (code: ViewCode) => views.includes(code),
    [views],
  );

  const hasRole = useCallback(
    (role: Role | string) => {
      const normalized = normalizeRole(role);
      if (!normalized) {
        return false;
      }
      return roles.includes(normalized);
    },
    [roles],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      views,
      hasView,
      roles,
      hasRole,
      login,
      logout,
      refreshUser,
      isLoading,
    }),
    [hasRole, hasView, isLoading, login, logout, refreshUser, roles, user, views],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
