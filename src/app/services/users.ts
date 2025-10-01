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

const USERS_ENDPOINT = '/usuarios';

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
  };
};

export async function getUsers(filters: UserFilters): Promise<Paginated<ManagedUser>> {
  const { page, search, page_size = USERS_PAGE_SIZE, role } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (typeof role === 'string' && role.trim().length > 0) {
    params.role = role;
  }

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
  const body: UserPayload = {
    username: payload.username,
    persona_id: payload.persona_id,
  };

  if (payload.email !== undefined) {
    body.email = payload.email;
  }

  if (payload.password) {
    body.password = payload.password;
  }

  const { data } = await api.patch<ApiManagedUser>(`${USERS_ENDPOINT}/${id}`, body);
  return mapUser(data);
}

export async function deleteUser(id: number) {
  await api.delete(`${USERS_ENDPOINT}/${id}`);
}
