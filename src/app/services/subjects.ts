import api from '@/app/services/api';
import type { Paginated, Subject, SubjectFilters, SubjectPayload } from '@/app/types';

export const SUBJECTS_PAGE_SIZE = 10;

export async function getSubjects(filters: SubjectFilters) {
  const { page, search, page_size = SUBJECTS_PAGE_SIZE, curso_id } = filters;
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

  const { data } = await api.get<Paginated<Subject>>('/subjects', {
    params,
  });
  return data;
}

export async function getSubject(id: number) {
  const { data } = await api.get<Subject>(`/subjects/${id}`);
  return data;
}

export async function createSubject(payload: SubjectPayload) {
  const { data } = await api.post<Subject>('/subjects', payload);
  return data;
}

export async function updateSubject(id: number, payload: SubjectPayload) {
  const { data } = await api.put<Subject>(`/subjects/${id}`, payload);
  return data;
}

export async function deleteSubject(id: number) {
  await api.delete(`/subjects/${id}`);
}

export async function getAllSubjects() {
  const { data } = await api.get<Paginated<Subject>>('/subjects', {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return data.items;
}
