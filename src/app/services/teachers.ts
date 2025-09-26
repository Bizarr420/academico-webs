import api, { withTrailingSlash } from '@/app/services/api';
import type { Paginated, Teacher, TeacherFilters, TeacherPayload } from '@/app/types';

export const TEACHERS_PAGE_SIZE = 10;

const TEACHERS_ENDPOINT = '/docentes';

export async function getTeachers(filters: TeacherFilters) {
  const { page, search, page_size = TEACHERS_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<Teacher>>(withTrailingSlash(TEACHERS_ENDPOINT), {
    params,
  });
  return data;
}

export async function createTeacher(payload: TeacherPayload) {
  const { data } = await api.post<Teacher>(withTrailingSlash(TEACHERS_ENDPOINT), payload);
  return data;
}

export async function getTeacher(id: number) {
  const { data } = await api.get<Teacher>(`${TEACHERS_ENDPOINT}/${id}`);
  return data;
}

export async function updateTeacher(id: number, payload: TeacherPayload) {
  const { data } = await api.patch<Teacher>(`${TEACHERS_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deleteTeacher(id: number) {
  await api.delete(`${TEACHERS_ENDPOINT}/${id}`);
}
