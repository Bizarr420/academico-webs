import { createContext } from 'react';

import type { Role, User, ViewCode } from '@/app/types';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  views: ViewCode[];
  hasView: (code: ViewCode) => boolean;
  roles: Role[];
  hasRole: (role: Role | string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void> | void;
  refreshUser: () => Promise<User | null>;
  bypassViewCheck: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  views: [],
  hasView: () => false,
  roles: [],
  hasRole: () => false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => null,
  bypassViewCheck: false,
});

export type { AuthContextValue };
