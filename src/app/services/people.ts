import api from '@/app/services/api';
import type { Paginated, Person, PersonFilters, PersonPayload } from '@/app/types';

export const PEOPLE_PAGE_SIZE = 10;

export async function getPeople(filters: PersonFilters) {
  const { page, search, page_size = PEOPLE_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<Person>>('/people', {
    params,
  });
  return data;
}

export async function getPerson(id: number) {
  const { data } = await api.get<Person>(`/people/${id}`);
  return data;
}

export async function createPerson(payload: PersonPayload) {
  const { data } = await api.post<Person>('/people', payload);
  return data;
}

export async function updatePerson(id: number, payload: PersonPayload) {
  const { data } = await api.put<Person>(`/people/${id}`, payload);
  return data;
}

export async function deletePerson(id: number) {
  await api.delete(`/people/${id}`);
}

export async function getAllPeople() {
  const { data } = await api.get<Paginated<Person>>('/people', {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return data.items;
}
