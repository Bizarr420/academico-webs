import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  Alert,
  AlertCollection,
  AlertFilters,
  AlertStatusPayload,
  AlertSummaryBreakdown,
  PaginatedResponse,
} from '@/app/types';

const ALERTS_ENDPOINT = 'alertas';

interface ApiAlert {
  id: number;
  estudiante: string;
  estudiante_id: number;
  curso?: string | null;
  periodo?: string | null;
  motivo: string;
  tipo?: string | null;
  score: number;
  estado: string;
  fecha: string;
  comentario?: string | null;
  observacion?: string | null;
}

type ApiAlertSummary =
  | {
      por_estado?: Record<string, number> | null;
      por_tipo?: Record<string, number> | null;
      estados?: Record<string, number> | null;
      tipos?: Record<string, number> | null;
    }
  | null
  | undefined;

type ApiAlertsResponse = PaginatedResponse<ApiAlert> & {
  resumen?: ApiAlertSummary;
  observaciones?: string[] | null;
};

const mapAlert = (alert: ApiAlert): Alert => ({
  id: alert.id,
  estudiante: alert.estudiante,
  estudiante_id: alert.estudiante_id,
  curso: alert.curso ?? null,
  periodo: alert.periodo ?? null,
  motivo: alert.motivo,
  tipo: alert.tipo ?? null,
  score: alert.score,
  estado: alert.estado,
  fecha: alert.fecha,
  comentario: alert.comentario ?? null,
  observacion: alert.observacion ?? alert.comentario ?? null,
});

const normalizeSummary = (summary: ApiAlertSummary): AlertSummaryBreakdown | null => {
  if (!summary) {
    return null;
  }

  const byStatus = summary.por_estado ?? summary.estados ?? null;
  const byType = summary.por_tipo ?? summary.tipos ?? null;

  return {
    por_estado: byStatus ?? {},
    por_tipo: byType ?? {},
  } satisfies AlertSummaryBreakdown;
};

export async function getAlerts(filters: AlertFilters): Promise<AlertCollection> {
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

  const { data } = await api.get<ApiAlertsResponse>(withTrailingSlash(ALERTS_ENDPOINT), {
    params,
  });

  const normalized = normalizePaginatedResponse(data);
  const summary = normalizeSummary((data as ApiAlertsResponse).resumen);
  const observationsSource = Array.isArray((data as ApiAlertsResponse).observaciones)
    ? (data as ApiAlertsResponse).observaciones ?? []
    : [];
  const observations = observationsSource
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return {
    ...normalized,
    items: normalized.items.map((item) => mapAlert(item as ApiAlert)),
    resumen: summary,
    observaciones: observations,
  } satisfies AlertCollection;
}

export async function updateAlertStatus(id: number, payload: AlertStatusPayload) {
  const body: Record<string, unknown> = {
    estado: payload.estado,
  };

  const observation = payload.observacion?.trim();
  const comment = payload.comentario?.trim();

  if (observation && observation.length > 0) {
    body.observacion = observation;
    if (!comment) {
      body.comentario = observation;
    }
  }

  if (comment && comment.length > 0) {
    body.comentario = comment;
  }

  const { data } = await api.post<ApiAlert>(`${withTrailingSlash(ALERTS_ENDPOINT)}${id}/estado`, body);
  return mapAlert(data);
}

