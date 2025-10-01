import api from '@/app/services/api';
import type { ApiUser, ApiView, View } from '@/app/types';
import { normalizeViewCode } from '@/app/utils/views';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const dedupeViews = (views: (ApiView | View)[]): (ApiView | View)[] => {
  const map = new Map<string, ApiView | View>();

  views.forEach((view, index) => {
    const code = normalizeViewCode(view.codigo);
    if (!code) {
      return;
    }

    map.set(code, {
      ...view,
      id: typeof view.id === 'number' ? view.id : index + 1,
      nombre: typeof view.nombre === 'string' && view.nombre.trim() ? view.nombre : code,
      codigo: code,
      descripcion:
        typeof view.descripcion === 'string' && view.descripcion.trim() ? view.descripcion : null,
    });
  });

  return Array.from(map.values());
};

const coerceViews = (value: unknown): (ApiView | View)[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    const collected: (ApiView | View)[] = [];
    value.forEach((item, index) => {
      if (typeof item === 'string' || typeof item === 'number') {
        const code = normalizeViewCode(String(item));
        if (code) {
          collected.push({
            id: index + 1,
            nombre: code,
            codigo: code,
            descripcion: null,
          });
        }
        return;
      }

      if (isRecord(item)) {
        const rawCode =
          'codigo' in item
            ? item.codigo
            : 'code' in item
              ? item.code
              : 'permiso' in item
                ? item.permiso
                : 'permission' in item
                  ? item.permission
                  : undefined;

        if (rawCode === undefined || rawCode === null) {
          return;
        }

        const code = normalizeViewCode(String(rawCode));
        if (!code) {
          return;
        }

        const id =
          typeof item.id === 'number'
            ? item.id
            : typeof item.vista_id === 'number'
              ? item.vista_id
              : index + 1;
        const nombre =
          typeof item.nombre === 'string' && item.nombre.trim()
            ? item.nombre
            : typeof item.label === 'string' && item.label.trim()
              ? item.label
              : code;
        const descripcion =
          typeof item.descripcion === 'string' && item.descripcion.trim()
            ? item.descripcion
            : null;

        collected.push({
          id,
          nombre,
          codigo: code,
          descripcion,
        });
      }
    });

    return dedupeViews(collected);
  }

  if (isRecord(value)) {
    if (Array.isArray(value.items)) {
      return coerceViews(value.items);
    }
    if (Array.isArray(value.data)) {
      return coerceViews(value.data);
    }
    return dedupeViews(
      Object.values(value).flatMap((item, index) =>
        Array.isArray(item)
          ? coerceViews(item)
          : typeof item === 'string' || typeof item === 'number'
            ? [
                {
                  id: index + 1,
                  nombre: normalizeViewCode(String(item)),
                  codigo: normalizeViewCode(String(item)),
                  descripcion: null,
                },
              ]
            : [],
      ),
    );
  }

  return [];
};

const collectViews = (sources: unknown[]): (ApiView | View)[] => {
  const aggregated: (ApiView | View)[] = [];
  sources.forEach((source) => {
    const parsed = coerceViews(source);
    if (parsed.length) {
      aggregated.push(...parsed);
    }
  });
  return dedupeViews(aggregated);
};

const fetchPermissionsFallback = async (): Promise<(ApiView | View)[]> => {
  try {
    const { data } = await api.get<unknown>('/me/permisos');
    return collectViews([data]);
  } catch (error) {
    console.warn('Failed to fetch permissions from fallback endpoint', error);
    return [];
  }
};

export const authLogin = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    withCredentials: true,
  });
};

export const authLogout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('auth/logout endpoint returned an error', error);
    }
  }
};

export const fetchCurrentUser = async (): Promise<ApiUser> => {
  const { data } = await api.get<unknown>('/auth/me');

  if (!isRecord(data)) {
    throw new Error('Respuesta inesperada al obtener el usuario actual');
  }

  const candidateUser = isRecord(data.user) ? data.user : data;
  const user = isRecord(candidateUser) ? (candidateUser as ApiUser) : null;

  if (!user) {
    throw new Error('No se pudo determinar el usuario autenticado');
  }

  const views = collectViews([
    data.vistas,
    data.permissions,
    data.permisos,
    isRecord(data.user) ? data.user.vistas : undefined,
    isRecord(data.user) ? data.user.permissions : undefined,
    isRecord(data.user) ? data.user.permisos : undefined,
    user.vistas,
  ]);

  const vistas = views.length > 0 ? views : await fetchPermissionsFallback();

  return {
    ...user,
    vistas,
  };
};
