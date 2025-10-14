import axios, { type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';

const SESSION_TOKEN_STORAGE_KEY = 'session_token';
const TOKEN_KEY_SET = new Set([
  'token',
  'accesstoken',
  'access_token',
  'sessiontoken',
  'session_token',
  'apitoken',
  'api_token',
  'authtoken',
  'auth_token',
  'authorization',
]);

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Unable to access localStorage for session token handling', error);
    return null;
  }
};

let inMemorySessionToken: string | null = null;

const normalizeKey = (key: string) => key.replace(/[^a-z]/gi, '').toLowerCase();

const extractToken = (value: unknown, allowString = false): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    if (!allowString) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractToken(item, allowString);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeKey(key);
    const isTokenKey = TOKEN_KEY_SET.has(normalizedKey);
    const candidate = extractToken(item, allowString || isTokenKey);
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

const readTokenFromStoredUser = (): string | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const rawUser = storage.getItem('user');
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as unknown;
    return extractToken(parsed);
  } catch (error) {
    console.warn('Failed to parse stored user while extracting session token', error);
    return null;
  }
};

export const setSessionToken = (token: string | null) => {
  inMemorySessionToken = token ? token.trim() : null;
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (inMemorySessionToken) {
    storage.setItem(SESSION_TOKEN_STORAGE_KEY, inMemorySessionToken);
  } else {
    storage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
};

export const getSessionToken = (): string | null => {
  if (inMemorySessionToken) {
    return inMemorySessionToken;
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const storedToken = storage.getItem(SESSION_TOKEN_STORAGE_KEY);
  if (storedToken) {
    inMemorySessionToken = storedToken.trim();
    return inMemorySessionToken;
  }

  const userToken = readTokenFromStoredUser();
  if (userToken) {
    setSessionToken(userToken);
    return userToken;
  }

  return null;
};

const formatAuthorizationToken = (token: string) => {
  const trimmed = token.trim();
  return /^bearer\s+/i.test(trimmed) ? trimmed : `Bearer ${trimmed}`;
};

export const getAuthHeaders = () => {
  const token = getSessionToken();
  if (!token) {
    return {} as Record<string, string>;
  }

  return { Authorization: formatAuthorizationToken(token) };
};

export const withAuth = <T = unknown>(config: AxiosRequestConfig<T> = {}) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      ...headers,
    },
  } satisfies AxiosRequestConfig<T>;
};

export const rememberSessionToken = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      setSessionToken(trimmed);
      return trimmed;
    }
  }

  const token = extractToken(value);
  if (token) {
    setSessionToken(token);
  }
  return token;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
});

export const withTrailingSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  const headers = { ...(config.headers ?? {}) } as AxiosRequestHeaders;

  if (token) {
    headers.Authorization = formatAuthorizationToken(token);
  }

  if (!headers.Accept) {
    headers.Accept = 'application/json';
  }

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      setSessionToken(null);
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
