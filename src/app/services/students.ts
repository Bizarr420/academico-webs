import api from '@/app/services/api';
import type { Paginated, Student, StudentFilters, StudentPayload } from '@/app/types';

export const STUDENTS_PAGE_SIZE = 10;

export async function getStudents(filters: StudentFilters) {
  const { page, search, page_size = STUDENTS_PAGE_SIZE } = filters;
  const { data } = await api.get<Paginated<Student>>('/students', {
    params: {
      page,
      page_size,
      search: search ?? '',
    },
  });
  return data;
}

export async function createStudent(payload: StudentPayload) {
  const { data } = await api.post<Student>('/students', payload);
  return data;
}
