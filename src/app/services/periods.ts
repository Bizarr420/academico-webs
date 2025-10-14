import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { Paginated, PaginatedResponse, Period, PeriodFilters } from '@/app/types';

const PERIODS_ENDPOINT = '/periodos';

interface ApiPeriod {
  id: number;
  nombre: string;
  gestion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
  activo?: boolean | null;
}

const mapPeriod = (period: ApiPeriod): Period => ({
  id: period.id,
  nombre: period.nombre,
  gestion: period.gestion ?? null,
  fecha_inicio: period.fecha_inicio ?? null,
  fecha_fin: period.fecha_fin ?? null,
  estado: period.estado ?? null,
  activo: period.activo ?? null,
});

export async function getPeriods(filters: PeriodFilters): Promise<Paginated<Period>> {
  const { page, page_size = 20, estado, vigente } = filters;

  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  if (typeof vigente === 'boolean') {
    params.vigente = vigente ? 1 : 0;
  }

  const { data } = await api.get<PaginatedResponse<ApiPeriod>>(withTrailingSlash(PERIODS_ENDPOINT), {
    params,
  });

  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map((period) => mapPeriod(period as ApiPeriod)),
  } satisfies Paginated<Period>;
}

export async function getAllPeriods(): Promise<Period[]> {
  const { data } = await api.get<PaginatedResponse<ApiPeriod>>(withTrailingSlash(PERIODS_ENDPOINT), {
    params: {
      page: 1,
      page_size: 100,
      vigente: 1,
    },
  });

  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map((period) => mapPeriod(period as ApiPeriod));
}

