import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { Alert, AlertFilters, AlertStatusPayload, Paginated, PaginatedResponse } from '@/app/types';

const ALERTS_ENDPOINT = '/alertas';

interface ApiAlert {
  id: number;
  estudiante: string;
  estudiante_id: number;
  curso?: string | null;
  periodo?: string | null;
  motivo: string;
  score: number;
  estado: string;
  fecha: string;
  comentario?: string | null;
}

const mapAlert = (alert: ApiAlert): Alert => ({
  id: alert.id,
  estudiante: alert.estudiante,
  estudiante_id: alert.estudiante_id,
  curso: alert.curso ?? null,
  periodo: alert.periodo ?? null,
  motivo: alert.motivo,
  score: alert.score,
  estado: alert.estado,
  fecha: alert.fecha,
  comentario: alert.comentario ?? null,
});

export async function getAlerts(filters: AlertFilters): Promise<Paginated<Alert>> {
  const { page, page_size = 10, estado, curso_id, periodo_id, search } = filters;

  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  if (typeof curso_id === 'number') {
    params.curso_id = curso_id;
  }

  if (typeof periodo_id === 'number') {
    params.periodo_id = periodo_id;
  }

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<PaginatedResponse<ApiAlert>>(withTrailingSlash(ALERTS_ENDPOINT), {
    params,
  });

  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map((item) => mapAlert(item as ApiAlert)),
  } satisfies Paginated<Alert>;
}

export async function updateAlertStatus(id: number, payload: AlertStatusPayload) {
  const body: Record<string, unknown> = {
    estado: payload.estado,
  };

  if (payload.comentario && payload.comentario.trim().length > 0) {
    body.comentario = payload.comentario.trim();
  }

  const { data } = await api.post<ApiAlert>(`${withTrailingSlash(ALERTS_ENDPOINT)}${id}/estado`, body);
  return mapAlert(data);
}

