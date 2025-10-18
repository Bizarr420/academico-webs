import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  Course,
  CourseFilters,
  CoursePayload,
  CourseParallel,
  Paginated,
  PaginatedResponse,
  Subject,
} from '@/app/types';
import { mapSubjectFromApi } from '@/app/services/subjects';

export const COURSES_PAGE_SIZE = 10;

const COURSES_ENDPOINT = 'cursos';

interface ApiCourseParallel {
  id: number;
  nombre?: string | null;
  etiqueta?: string | null;
}

interface ApiCourseSubject extends Omit<Subject, 'curso' | 'paralelo'> {
  curso?: string | null;
  paralelo?: string | null;
}

interface ApiCourse {
  id: number;
  nombre: string;
  etiqueta?: string | null;
  nivel_id?: number | null;
  // puede venir como string o como objeto { id, nombre }
  nivel?: unknown;
  grado?: number | null;
  paralelos?: ApiCourseParallel[] | null;
  materias?: ApiCourseSubject[] | null;
  estado?: string | null;
  activo?: boolean | null;
  eliminado_en?: string | null;
}

const mapCourseParallel = (parallel: ApiCourseParallel): CourseParallel => ({
  id: parallel.id,
  nombre: parallel.nombre ?? null,
  etiqueta: parallel.etiqueta ?? null,
});

const mapCourse = (course: ApiCourse): Course => ({
  id: course.id,
  nombre: course.nombre,
  etiqueta: course.etiqueta ?? null,
  nivel_id: course.nivel_id ?? null,
  nivel:
    typeof (course as any).nivel === 'string'
      ? ((course as any).nivel as string)
      : typeof (course as any).nivel === 'object' && (course as any).nivel !== null
        ? ((course as any).nivel as { nombre?: string | null }).nombre ?? null
        : null,
  grado: course.grado ?? null,
  paralelos: Array.isArray(course.paralelos)
    ? course.paralelos.map((parallel) => mapCourseParallel(parallel))
    : undefined,
  materias: Array.isArray(course.materias)
    ? course.materias.map((subject) => mapSubjectFromApi(subject))
    : undefined,
  estado: course.estado ?? null,
  activo: course.activo ?? null,
  eliminado_en: course.eliminado_en ?? null,
});

const mapCoursePayloadToApi = (payload: CoursePayload) => {
  const body: Record<string, unknown> = {
    nombre: payload.nombre,
    etiqueta: payload.etiqueta,
    nivel_id: payload.nivel_id,
    grado: payload.grado,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
};

export async function getCourses(filters: CourseFilters): Promise<Paginated<Course>> {
  const { page, search, page_size = COURSES_PAGE_SIZE, estado, incluir_inactivos, activo } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
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

  const { data } = await api.get<PaginatedResponse<ApiCourse>>(
    withTrailingSlash(COURSES_ENDPOINT),
    withAuth({
      params,
    }),
  );
  const normalized = normalizePaginatedResponse(data);
  return {
    ...normalized,
    items: normalized.items.map((course) => mapCourse(course as ApiCourse)),
  } satisfies Paginated<Course>;
}

export async function getCourse(id: number) {
  const { data } = await api.get<ApiCourse>(`${COURSES_ENDPOINT}/${id}`, withAuth());
  return mapCourse(data);
}

export async function createCourse(payload: CoursePayload) {
  const body = mapCoursePayloadToApi(payload);
  const { data } = await api.post<ApiCourse>(withTrailingSlash(COURSES_ENDPOINT), body, withAuth());
  return mapCourse(data);
}

export async function updateCourse(id: number, payload: CoursePayload) {
  const body = mapCoursePayloadToApi(payload);
  const { data } = await api.put<ApiCourse>(`${COURSES_ENDPOINT}/${id}`, body, withAuth());
  return mapCourse(data);
}

export async function deleteCourse(id: number) {
  await api.delete(`${COURSES_ENDPOINT}/${id}`, withAuth());
}

export async function getAllCourses(): Promise<Course[]> {
  const { data } = await api.get<PaginatedResponse<ApiCourse>>(
    withTrailingSlash(COURSES_ENDPOINT),
    withAuth({
      params: {
        page: 1,
        page_size: 1000,
        estado: 'ACTIVO',
      },
    }),
  );
  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map((course) => mapCourse(course as ApiCourse));
}

export async function restoreCourse(id: number) {
  const { data } = await api.post<ApiCourse>(
    `${withTrailingSlash(COURSES_ENDPOINT)}${id}/restore`,
    undefined,
    withAuth(),
  );
  return mapCourse(data);
}
