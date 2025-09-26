import api from '@/app/services/api';
import type { Paginated, Student, StudentFilters, StudentPayload } from '@/app/types';

export const STUDENTS_PAGE_SIZE = 10;

export async function getStudents(filters: StudentFilters) {
  const { page, search, page_size = STUDENTS_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<Student>>('/students', {
    params,
  });
  return data;
}

export async function createStudent(payload: StudentPayload) {
  const { data } = await api.post<Student>('/students', payload);
  return data;
}

export async function getStudent(id: number) {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
}

export async function updateStudent(id: number, payload: StudentPayload) {
  const { data } = await api.put<Student>(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id: number) {
  await api.delete(`/students/${id}`);
}
