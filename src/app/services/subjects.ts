import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  Paginated,
  PaginatedResponse,
  Subject,
  SubjectFilters,
  SubjectPayload,
} from '@/app/types';

export const SUBJECTS_PAGE_SIZE = 10;

const SUBJECTS_ENDPOINT = '/materias';

interface ApiSubject {
  id: number;
  nombre: string;
  codigo?: string | null;
  curso_id: number;
  curso?: string | null;
  curso_nombre?: string | null;
  cursoName?: string | null;
  paralelo?: string | null;
  paralelo_nombre?: string | null;
  paraleloName?: string | null;
  paralelo_etiqueta?: string | null;
  area?: string | null;
  estado?: string | null;
  descripcion?: string | null;
  activo?: boolean | null;
  eliminado_en?: string | null;
}

const extractCourseName = (subject: ApiSubject) =>
  subject.curso ?? subject.curso_nombre ?? subject.cursoName ?? null;

const extractParallelName = (subject: ApiSubject) =>
  subject.paralelo ?? subject.paralelo_nombre ?? subject.paraleloName ?? subject.paralelo_etiqueta ?? null;

const extractSubjectCode = (subject: ApiSubject) => subject.codigo ?? null;

export const mapSubjectFromApi = (subject: ApiSubject | Subject): Subject => {
  const base = subject as ApiSubject;
  return {
    id: subject.id,
    nombre: subject.nombre,
    codigo: extractSubjectCode(base) ?? (subject as Subject).codigo ?? '',
    curso_id: subject.curso_id,
    curso: extractCourseName(base) ?? subject.curso ?? null,
    paralelo: extractParallelName(base) ?? subject.paralelo ?? null,
    area: base.area ?? subject.area ?? null,
    estado: base.estado ?? subject.estado ?? null,
    descripcion: base.descripcion ?? subject.descripcion ?? null,
    activo: base.activo ?? subject.activo ?? null,
    eliminado_en: base.eliminado_en ?? subject.eliminado_en ?? null,
  } satisfies Subject;
};

const mapSubjectPayloadToApi = (payload: SubjectPayload) => {
  const body: Record<string, unknown> = {
    nombre: payload.nombre,
    codigo: payload.codigo,
    curso_id: payload.curso_id,
    descripcion: payload.descripcion,
    area: payload.area,
    estado: payload.estado,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
};

export async function getSubjects(filters: SubjectFilters): Promise<Paginated<Subject>> {
  const {
    page,
    search,
    page_size = SUBJECTS_PAGE_SIZE,
    curso_id,
    estado,
    incluir_inactivos,
    activo,
  } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (typeof curso_id === 'number') {
    params.curso_id = curso_id;
  }

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  if (typeof activo === 'boolean') {
    params.activo = activo ? 1 : 0;
  }

  if (incluir_inactivos) {
    params.incluir_inactivos = 1;
  }

  const { data } = await api.get<PaginatedResponse<ApiSubject>>(withTrailingSlash(SUBJECTS_ENDPOINT), {
    params,
  });
  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map((subject) => mapSubjectFromApi(subject as ApiSubject)),
  } satisfies Paginated<Subject>;
}

export async function getSubject(id: number) {
  const { data } = await api.get<ApiSubject>(`${SUBJECTS_ENDPOINT}/${id}`);
  return mapSubjectFromApi(data);
}

export async function createSubject(payload: SubjectPayload) {
  const body = mapSubjectPayloadToApi(payload);
  const { data } = await api.post<ApiSubject>(withTrailingSlash(SUBJECTS_ENDPOINT), body);
  return mapSubjectFromApi(data);
}

export async function updateSubject(id: number, payload: SubjectPayload) {
  const body = mapSubjectPayloadToApi(payload);
  const { data } = await api.put<ApiSubject>(`${SUBJECTS_ENDPOINT}/${id}`, body);
  return mapSubjectFromApi(data);
}

export async function deleteSubject(id: number) {
  await api.delete(`${SUBJECTS_ENDPOINT}/${id}`);
}

export async function restoreSubject(id: number) {
  const { data } = await api.post<ApiSubject>(
    `${withTrailingSlash(SUBJECTS_ENDPOINT)}${id}/restore`,
    undefined,
  );
  return mapSubjectFromApi(data);
}

export async function getAllSubjects(): Promise<Subject[]> {
  const { data } = await api.get<PaginatedResponse<ApiSubject>>(withTrailingSlash(SUBJECTS_ENDPOINT), {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map((subject) => mapSubjectFromApi(subject as ApiSubject));
}
