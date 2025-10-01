import api, { withTrailingSlash } from '@/app/services/api';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type { Paginated, PaginatedResponse, Subject, SubjectFilters, SubjectPayload } from '@/app/types';

export const SUBJECTS_PAGE_SIZE = 10;

const SUBJECTS_ENDPOINT = '/materias';

export async function getSubjects(filters: SubjectFilters): Promise<Paginated<Subject>> {
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

  const { data } = await api.get<PaginatedResponse<Subject>>(withTrailingSlash(SUBJECTS_ENDPOINT), {
    params,
  });
  return normalizePaginatedResponse(data);
}

export async function getSubject(id: number) {
  const { data } = await api.get<Subject>(`${SUBJECTS_ENDPOINT}/${id}`);
  return data;
}

export async function createSubject(payload: SubjectPayload) {
  const { data } = await api.post<Subject>(withTrailingSlash(SUBJECTS_ENDPOINT), payload);
  return data;
}

export async function updateSubject(id: number, payload: SubjectPayload) {
  const { data } = await api.put<Subject>(`${SUBJECTS_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deleteSubject(id: number) {
  await api.delete(`${SUBJECTS_ENDPOINT}/${id}`);
}

export async function getAllSubjects(): Promise<Subject[]> {
  const { data } = await api.get<PaginatedResponse<Subject>>(withTrailingSlash(SUBJECTS_ENDPOINT), {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return normalizePaginatedResponse(data).items;
}
