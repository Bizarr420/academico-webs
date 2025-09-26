import api from '@/app/services/api';
import type { Paginated, Teacher, TeacherFilters, TeacherPayload } from '@/app/types';

export const TEACHERS_PAGE_SIZE = 10;

export async function getTeachers(filters: TeacherFilters) {
  const { page, search, page_size = TEACHERS_PAGE_SIZE } = filters;
  const { data } = await api.get<Paginated<Teacher>>('/teachers', {
    params: {
      page,
      page_size,
      search: search ?? '',
    },
  });
  return data;
}

export async function createTeacher(payload: TeacherPayload) {
  const { data } = await api.post<Teacher>('/teachers', payload);
  return data;
}

export async function getTeacher(id: number) {
  const { data } = await api.get<Teacher>(`/teachers/${id}`);
  return data;
}

export async function updateTeacher(id: number, payload: TeacherPayload) {
  const { data } = await api.put<Teacher>(`/teachers/${id}`, payload);
  return data;
}

export async function deleteTeacher(id: number) {
  await api.delete(`/teachers/${id}`);
}
