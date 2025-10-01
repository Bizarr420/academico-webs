import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { Paginated, PaginatedResponse, Student, StudentFilters, StudentPayload } from '@/app/types';

export const STUDENTS_PAGE_SIZE = 10;

const STUDENTS_ENDPOINT = '/estudiantes';

export async function getStudents(filters: StudentFilters): Promise<Paginated<Student>> {
  const { page, search, codigo_rude, page_size = STUDENTS_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof codigo_rude === 'string' && codigo_rude.trim().length > 0) {
    params.codigo_rude = codigo_rude.trim();
  } else if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<PaginatedResponse<Student>>(withTrailingSlash(STUDENTS_ENDPOINT), withAuth({ params }));
  return normalizePaginatedResponse(data);
}

export async function createStudent(payload: StudentPayload) {
  const { data } = await api.post<Student>(withTrailingSlash(STUDENTS_ENDPOINT), payload, withAuth());
  return data;
}

export async function getStudent(id: number) {
  const { data } = await api.get<Student>(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, withAuth());
  return data;
}

export async function updateStudent(id: number, payload: StudentPayload) {
  const { data } = await api.patch<Student>(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, payload, withAuth());
  return data;
}

export async function deleteStudent(id: number) {
  await api.delete(`${withTrailingSlash(STUDENTS_ENDPOINT)}${id}`, withAuth());
}
