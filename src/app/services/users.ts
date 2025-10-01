import api, { withTrailingSlash } from '@/app/services/api';
import type {
  ApiManagedUser,
  ManagedUser,
  Paginated,
  UserFilters,
  UserPayload,
} from '@/app/types';
import { normalizeRole } from '@/app/utils/roles';

export const USERS_PAGE_SIZE = 10;

const USERS_ENDPOINT = '/usuarios';

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

  if (typeof role === 'string' && role.trim().length > 0) {
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
