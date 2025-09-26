import api from '@/app/services/api';
import type { Course, CourseFilters, CoursePayload, Paginated } from '@/app/types';

export const COURSES_PAGE_SIZE = 10;

export async function getCourses(filters: CourseFilters) {
  const { page, search, page_size = COURSES_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<Course>>('/courses', {
    params,
  });
  return data;
}

export async function getCourse(id: number) {
  const { data } = await api.get<Course>(`/courses/${id}`);
  return data;
}

export async function createCourse(payload: CoursePayload) {
  const { data } = await api.post<Course>('/courses', payload);
  return data;
}

export async function updateCourse(id: number, payload: CoursePayload) {
  const { data } = await api.put<Course>(`/courses/${id}`, payload);
  return data;
}

export async function deleteCourse(id: number) {
  await api.delete(`/courses/${id}`);
}

export async function getAllCourses() {
  const { data } = await api.get<Paginated<Course>>('/courses', {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return data.items;
}
