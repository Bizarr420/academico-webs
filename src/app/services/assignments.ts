import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  Assignment,
  AssignmentFilters,
  AssignmentPayload,
  Paginated,
  PaginatedResponse,
} from '@/app/types';

const ASSIGNMENTS_ENDPOINT = 'asignaciones';

interface ApiAssignment {
  id: number;
  curso_id: number;
  curso?: string | null;
  paralelo_id?: number | null;
  paralelo?: string | null;
  materia_id: number;
  materia?: string | null;
  docente_id: number;
  docente?: string | null;
  periodo_id: number;
  periodo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  actualizado_en?: string | null;
  creado_en?: string | null;
  estado?: string | null;
  activo?: boolean | null;
  eliminado_en?: string | null;
  relaciones?: {
    curso?: string | null;
    paralelo?: string | null;
    materia?: string | null;
    docente?: string | null;
    periodo?: string | null;
  } | null;
}

const mapAssignment = (assignment: ApiAssignment): Assignment => ({
  id: assignment.id,
  curso_id: assignment.curso_id,
  curso: assignment.curso ?? null,
  paralelo_id: assignment.paralelo_id ?? null,
  paralelo: assignment.paralelo ?? null,
  materia_id: assignment.materia_id,
  materia: assignment.materia ?? null,
  docente_id: assignment.docente_id,
  docente: assignment.docente ?? null,
  periodo_id: assignment.periodo_id,
  periodo: assignment.periodo ?? null,
  fecha_inicio: assignment.fecha_inicio ?? null,
  fecha_fin: assignment.fecha_fin ?? null,
  actualizado_en: assignment.actualizado_en ?? null,
  creado_en: assignment.creado_en ?? null,
  estado: assignment.estado ?? null,
  activo: typeof assignment.activo === 'boolean' ? assignment.activo : null,
  eliminado_en: assignment.eliminado_en ?? null,
  relaciones: assignment.relaciones ?? null,
});

const mapPayload = (payload: AssignmentPayload) => {
  const body: Record<string, unknown> = {
    curso_id: payload.curso_id,
    paralelo_id: payload.paralelo_id,
    materia_id: payload.materia_id,
    docente_id: payload.docente_id,
    periodo_id: payload.periodo_id,
    fecha_inicio: payload.fecha_inicio,
    fecha_fin: payload.fecha_fin,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
};

export async function getAssignments(filters: AssignmentFilters): Promise<Paginated<Assignment>> {
  const {
    page,
    page_size = 10,
    periodo_id,
    curso_id,
    paralelo_id,
    materia_id,
    docente_id,
    search,
    estado,
    activo,
    incluir_inactivos,
  } = filters;

  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof periodo_id === 'number') {
    params.periodo_id = periodo_id;
  }

  if (typeof curso_id === 'number') {
    params.curso_id = curso_id;
  }

  if (typeof paralelo_id === 'number') {
    params.paralelo_id = paralelo_id;
  }

  if (typeof materia_id === 'number') {
    params.materia_id = materia_id;
  }

  if (typeof docente_id === 'number') {
    params.docente_id = docente_id;
  }

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  if (typeof activo === 'boolean') {
    params.activo = activo;
  }

  if (typeof incluir_inactivos === 'boolean') {
    params.incluir_inactivos = incluir_inactivos;
  }

  const { data } = await api.get<PaginatedResponse<ApiAssignment>>(
    withTrailingSlash(ASSIGNMENTS_ENDPOINT),
    withAuth({ params }),
  );

  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map((item) => mapAssignment(item as ApiAssignment)),
  } satisfies Paginated<Assignment>;
}

export async function createAssignment(payload: AssignmentPayload) {
  const body = mapPayload(payload);
  const { data } = await api.post<ApiAssignment>(withTrailingSlash(ASSIGNMENTS_ENDPOINT), body, withAuth());
  return mapAssignment(data);
}

export async function updateAssignment(id: number, payload: AssignmentPayload) {
  const body = mapPayload(payload);
  const { data } = await api.put<ApiAssignment>(`${withTrailingSlash(ASSIGNMENTS_ENDPOINT)}${id}`, body, withAuth());
  return mapAssignment(data);
}

export async function deleteAssignment(id: number) {
  await api.delete(`${withTrailingSlash(ASSIGNMENTS_ENDPOINT)}${id}`, withAuth());
}

