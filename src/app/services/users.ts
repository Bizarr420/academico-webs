import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  ApiManagedUser,
  ManagedUser,
  Paginated,
  PaginatedResponse,
  Role,
  UserFilters,
  UserPayload,
} from '@/app/types';
import { normalizeRole } from '@/app/utils/roles';

export const USERS_PAGE_SIZE = 10;

const USERS_ENDPOINT = 'usuarios';

const normalizeUserRoles = (
  roles: (Role | string | null | undefined)[] | null | undefined,
  fallback: Role | string | null | undefined,
): Role[] => {
  const normalized = new Set<Role>();

  if (Array.isArray(roles)) {
    roles.forEach((role) => {
      const normalizedRole = normalizeRole(role ?? undefined);
      if (normalizedRole) {
        normalized.add(normalizedRole);
      }
    });
  }

  const normalizedFallback = normalizeRole(fallback ?? undefined);
  if (normalizedFallback) {
    normalized.add(normalizedFallback);
  }

  return Array.from(normalized);
};

const mapUser = (user: ApiManagedUser): ManagedUser => {
  const normalizedRoles = normalizeUserRoles(user.roles ?? null, user.role);
  return {
    ...user,
    role: normalizedRoles[0] ?? normalizeRole(user.role),
    roles: normalizedRoles,
    rol: (user as any).rol ?? null,
    rol_id: user.rol_id ?? null,
  };
};

export async function getUsers(filters: UserFilters): Promise<Paginated<ManagedUser>> {

  const {
    page = 1,
    search,
    page_size = USERS_PAGE_SIZE,
    role,
    estado,
    rol_id,
    ...rest
  } = filters;

  const params: Record<string, unknown> = {
    offset: (page - 1) * page_size,
    limit: page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (typeof rol_id === 'number' && !isNaN(rol_id)) {
    params.rol_id = rol_id;
  }

  if ((typeof role === 'string' && role.trim().length > 0) || typeof role === 'number') {
    const parsedRole = typeof role === 'number' ? role : parseInt(role, 10);
    if (!isNaN(parsedRole)) {
      params.rol_id = parsedRole;
    }
  }

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim().toUpperCase();
  }

  // Incluir cualquier otro filtro adicional
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value;
    }
  });

  console.log('getUsers params:', params);
  const { data } = await api.get<PaginatedResponse<ApiManagedUser>>(withTrailingSlash(USERS_ENDPOINT), {
    params,
  });
  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map(mapUser),
  };
}

export async function getUser(id: number) {
  const { data } = await api.get<ApiManagedUser>(`${USERS_ENDPOINT}/${id}`);
  return mapUser(data);
}

export async function createUser(payload: UserPayload) {
  const { data } = await api.post<ApiManagedUser>(withTrailingSlash(USERS_ENDPOINT), payload);
  return mapUser(data);
}

export async function updateUser(id: number, payload: UserPayload) {
  let body: UserPayload = {
    ...payload,
  };
  
  // Solo incluir password si se proporciona uno nuevo
  if (!body.password) {
    delete body.password;
  }

  // Manejar la actualización de persona
  if (payload.persona_id !== undefined) {
    body = {
      ...body,
      persona_id: payload.persona_id,
      persona: undefined // Eliminar persona si se proporciona persona_id
    };
  } else if (payload.persona) {
    body = {
      ...body,
      persona: payload.persona,
      persona_id: undefined // Eliminar persona_id si se proporciona persona
    };
  }

  const { data } = await api.patch<ApiManagedUser>(`${USERS_ENDPOINT}/${id}`, body);
  return mapUser(data);
}

export async function deactivateUser(id: number) {
  try {
    const { data } = await api.patch<ApiManagedUser>(`${USERS_ENDPOINT}/${id}/desactivar`);
    return mapUser(data);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const { data } = await api.patch<ApiManagedUser>(`${USERS_ENDPOINT}/desactivar`,
        { usuario_id: id },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return mapUser(data);
    }
    throw err;
  }
}

export async function activateUser(id: number) {
  const { data } = await api.patch<ApiManagedUser>(`${USERS_ENDPOINT}/${id}/activar`);
  return mapUser(data);
}
