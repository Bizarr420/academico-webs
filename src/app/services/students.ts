import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import { mapApiPerson } from '@/app/services/mappers';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  ApiPerson,
  Paginated,
  PaginatedResponse,
  Student,
  StudentFilters,
  StudentPayload,
  StudentSituation,
  StudentStatus,
} from '@/app/types';

export const STUDENTS_PAGE_SIZE = 10;

const STUDENTS_ENDPOINT = 'estudiantes';

type ApiStudent = {
  id: number;
  persona_id: number;
  codigo_rude: string;
  anio_ingreso?: number | null;
  situacion?: StudentSituation | null;
  estado?: StudentStatus | null;
  persona?: ApiPerson | null;
  activo?: boolean | null;
  eliminado_en?: string | null;
};

const mapApiStudent = (student: ApiStudent): Student => ({
  id: student.id,
  persona_id: student.persona_id,
  codigo_rude: student.codigo_rude,
  anio_ingreso: student.anio_ingreso ?? null,
  situacion: student.situacion ?? null,
  estado: student.estado ?? null,
  persona: student.persona ? mapApiPerson(student.persona) : null,
  activo: student.activo ?? null,
  eliminado_en: student.eliminado_en ?? null,
});

export async function getStudents(filters: StudentFilters): Promise<Paginated<Student>> {
  const {
    page,
    search,
    codigo_rude,
    page_size = STUDENTS_PAGE_SIZE,
    estado,
  } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof codigo_rude === 'string' && codigo_rude.trim().length > 0) {
    params.codigo_rude = codigo_rude.trim();
  } else if (typeof search === 'string' && search.trim().length > 0) {
    params.codigo_rude = search.trim();
  }

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  const { data } = await api.get<PaginatedResponse<ApiStudent>>(
    withTrailingSlash(STUDENTS_ENDPOINT),
    withAuth({ params }),
  );
  const normalized = normalizePaginatedResponse(data);
  return {
    items: normalized.items.map(mapApiStudent),
    total: normalized.total,
    page: normalized.page,
    page_size: normalized.page_size,
  };
}

export async function createStudent(payload: StudentPayload) {
  const { data } = await api.post<ApiStudent>(withTrailingSlash(STUDENTS_ENDPOINT), payload, withAuth());
  return mapApiStudent(data);
}

export async function getStudent(id: number) {
  const { data } = await api.get<ApiStudent>(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, withAuth());
  return mapApiStudent(data);
}

export async function updateStudent(id: number, payload: StudentPayload) {
  const { data } = await api.patch<ApiStudent>(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, payload, withAuth());
  return mapApiStudent(data);
}

export async function deleteStudent(id: number) {
  await api.delete(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, withAuth());
}

export async function restoreStudent(id: number) {
  const { data } = await api.post<ApiStudent>(
    `${withTrailingSlash(STUDENTS_ENDPOINT)}${id}/restore`,
    undefined,
    withAuth(),
  );
  return mapApiStudent(data);
}
