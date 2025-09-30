import api, { withTrailingSlash } from '@/app/services/api';
import { getViews, mapView } from '@/app/services/views';
import type {
  ApiRoleDefinition,
  ApiRoleOption,
  Paginated,
  RoleDefinition,
  RoleFilters,
  RoleOption,
  RolePayload,
} from '@/app/types';

export const ROLES_PAGE_SIZE = 10;

const ROLES_ENDPOINT = '/roles';
const ROLE_OPTIONS_ENDPOINT = '/roles/opciones';

const ROLE_ALIASES: Record<string, RoleOption['clave']> = {
  admin: 'admin',
  administrador: 'admin',
  adm: 'admin',
  docente: 'docente',
  doc: 'docente',
  padre: 'padre',
  pad: 'padre',
};

const normalizeRoleKey = (role: string): RoleOption['clave'] => {
  const normalized = `${role}`.trim().toLowerCase();

  return ROLE_ALIASES[normalized] ?? (normalized as RoleOption['clave']);
};

const mapRole = (role: ApiRoleDefinition): RoleDefinition => ({
  id: role.id,
  nombre: role.nombre,
  descripcion: role.descripcion ?? null,
  vistas: (role.vistas ?? []).map(mapView),
  vista_ids: role.vista_ids ?? (role.vistas ? role.vistas.map((view) => view.id) : []),
});

const mapRoleOption = (role: ApiRoleOption): RoleOption => ({
  id: role.id,
  nombre: role.nombre,
  clave: normalizeRoleKey(role.clave),
});

export async function getRoles(filters: RoleFilters) {
  const { page, search, page_size = ROLES_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<ApiRoleDefinition>>(withTrailingSlash(ROLES_ENDPOINT), {
    params,
  });

  return {
    ...data,
    items: data.items.map(mapRole),
  };
}

export async function getRole(id: number) {
  const { data } = await api.get<ApiRoleDefinition>(`${ROLES_ENDPOINT}/${id}`);
  return mapRole(data);
}

export async function createRole(payload: RolePayload) {
  const { data } = await api.post<ApiRoleDefinition>(withTrailingSlash(ROLES_ENDPOINT), payload);
  return mapRole(data);
}

export async function updateRole(id: number, payload: RolePayload) {
  const { data } = await api.patch<ApiRoleDefinition>(`${ROLES_ENDPOINT}/${id}`, payload);
  return mapRole(data);
}

export async function deleteRole(id: number) {
  await api.delete(`${ROLES_ENDPOINT}/${id}`);
}

export async function getAvailableRoleViews() {
  return getViews();
}

export async function getRoleOptions() {
  const { data } = await api.get<ApiRoleOption[]>(ROLE_OPTIONS_ENDPOINT);
  return data.map(mapRoleOption);
}
