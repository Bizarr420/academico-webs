import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { PaginatedResponse, RoleSummary } from '@/app/types';

const ROLES_ENDPOINT = 'roles';

interface ApiRoleSummary {
  id: number;
  nombre: string;
  codigo: string;
}

const mapRoleSummary = (role: ApiRoleSummary): RoleSummary => ({
  id: role.id,
  nombre: role.nombre,
  codigo: role.codigo,
});

export async function getAllRoles(): Promise<RoleSummary[]> {
  const { data } = await api.get<PaginatedResponse<ApiRoleSummary>>(withTrailingSlash(ROLES_ENDPOINT), {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map((role) => mapRoleSummary(role as ApiRoleSummary));
}
