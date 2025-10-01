import { createContext } from 'react';

import type { User, ViewCode } from '@/app/types';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  views: ViewCode[];
  hasView: (code: ViewCode) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void> | void;
  refreshUser: () => Promise<User | null>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  views: [],
  hasView: () => false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => null,
});

export type { AuthContextValue };
