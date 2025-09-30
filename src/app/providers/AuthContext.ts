import { createContext } from 'react';

import type { User, ViewCode } from '@/app/types';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  views: ViewCode[];
  hasView: (code: ViewCode) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  views: [],
  hasView: () => false,
  login: async () => {},
  logout: () => {},
});

export type { AuthContextValue };
