import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { Level, PaginatedResponse } from '@/app/types';

const LEVELS_ENDPOINT = '/niveles';

interface ApiLevel {
  id: number;
  nombre: string;
  etiqueta?: string | null;
}

const mapLevel = (level: ApiLevel): Level => ({
  id: level.id,
  nombre: level.nombre,
  etiqueta: level.etiqueta ?? null,
});

export async function getAllLevels(): Promise<Level[]> {
  const { data } = await api.get<PaginatedResponse<ApiLevel>>(withTrailingSlash(LEVELS_ENDPOINT), {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map((level) => mapLevel(level as ApiLevel));
}
