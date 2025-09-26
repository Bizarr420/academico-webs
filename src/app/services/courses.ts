import api, { withTrailingSlash } from '@/app/services/api';
import type { Course, CourseFilters, CoursePayload, Paginated } from '@/app/types';

export const COURSES_PAGE_SIZE = 10;

const COURSES_ENDPOINT = '/cursos';

export async function getCourses(filters: CourseFilters) {
  const { page, search, page_size = COURSES_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<Course>>(withTrailingSlash(COURSES_ENDPOINT), {
    params,
  });
  return data;
}

export async function getCourse(id: number) {
  const { data } = await api.get<Course>(`${COURSES_ENDPOINT}/${id}`);
  return data;
}

export async function createCourse(payload: CoursePayload) {
  const { data } = await api.post<Course>(withTrailingSlash(COURSES_ENDPOINT), payload);
  return data;
}

export async function updateCourse(id: number, payload: CoursePayload) {
  const { data } = await api.put<Course>(`${COURSES_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deleteCourse(id: number) {
  await api.delete(`${COURSES_ENDPOINT}/${id}`);
}

export async function getAllCourses() {
  const { data } = await api.get<Paginated<Course>>(withTrailingSlash(COURSES_ENDPOINT), {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return data.items;
}
