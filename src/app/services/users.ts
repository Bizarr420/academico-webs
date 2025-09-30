import api, { withTrailingSlash } from '@/app/services/api';
import type {
  ApiManagedUser,
  ManagedUser,
  Paginated,
  UserFilters,
  UserPayload,
} from '@/app/types';

export const USERS_PAGE_SIZE = 10;

const USERS_ENDPOINT = '/usuarios';

const ROLE_ALIASES: Record<string, ManagedUser['role']> = {
  admin: 'admin',
  administrador: 'admin',
  adm: 'admin',
  docente: 'docente',
  doc: 'docente',
  padre: 'padre',
  pad: 'padre',
};

const normalizeRole = (
  role: ApiManagedUser['role'] | ManagedUser['role'] | string,
): ManagedUser['role'] => {
  const normalized = `${role}`.trim().toLowerCase();

  return ROLE_ALIASES[normalized] ?? (normalized as ManagedUser['role']);
};

const mapUser = (user: ApiManagedUser): ManagedUser => ({
  ...user,
  role: normalizeRole(user.role),
});

export async function getUsers(filters: UserFilters) {
  const { page, search, page_size = USERS_PAGE_SIZE, role } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (role) {
    params.role = role;
  }

  const { data } = await api.get<Paginated<ApiManagedUser>>(withTrailingSlash(USERS_ENDPOINT), {
    params,
  });
  return {
    ...data,
    items: data.items.map(mapUser),
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
    role: payload.role,
    persona_id: payload.persona_id,
  };

  if (payload.email) {
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
