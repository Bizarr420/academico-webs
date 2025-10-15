import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import { mapApiPerson } from '@/app/services/mappers';
import { normalizePaginatedResponse } from '@/app/services/pagination';
import type {
  ApiPerson,
  Paginated,
  PaginatedResponse,
  Person,
  PersonFilters,
  PersonPayload,
} from '@/app/types';

export const PEOPLE_PAGE_SIZE = 10;

const PEOPLE_ENDPOINT = 'personas';

const mapPayloadToApi = (payload: PersonPayload) => {
  const body: Record<string, unknown> = {
    nombres: payload.nombres,
    apellidos: payload.apellidos,
    sexo: payload.sexo,
    fecha_nacimiento: payload.fecha_nacimiento,
    celular: payload.celular,
    direccion: payload.direccion,
    ci_numero: payload.ci_numero,
    ci_complemento: payload.ci_complemento,
    ci_expedicion: payload.ci_expedicion,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, unknown>;
};

export async function getPeople(filters: PersonFilters): Promise<Paginated<Person>> {
  const { page, search, page_size = PEOPLE_PAGE_SIZE, estado, incluir_inactivos, activo } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  if (typeof estado === 'string' && estado.trim().length > 0) {
    params.estado = estado.trim();
  }

  if (typeof activo === 'boolean') {
    params.activo = activo ? 1 : 0;
  }

  if (incluir_inactivos) {
    params.incluir_inactivos = 1;
  }

  const { data } = await api.get<PaginatedResponse<ApiPerson>>(
    withTrailingSlash(PEOPLE_ENDPOINT),
    withAuth({
      params,
    }),
  );
  const normalized = normalizePaginatedResponse(data);
  return {
    items: normalized.items.map(mapApiPerson),
    total: normalized.total,
    page: normalized.page,
    page_size: normalized.page_size,
  };
}

export async function getPerson(id: number) {
  const { data } = await api.get<ApiPerson>(`${PEOPLE_ENDPOINT}/${id}`, withAuth());
  return mapApiPerson(data);
}

export async function createPerson(payload: PersonPayload) {
  const body = mapPayloadToApi(payload);
  const { data } = await api.post<ApiPerson>(withTrailingSlash(PEOPLE_ENDPOINT), body, withAuth());
  return mapApiPerson(data);
}

export async function updatePerson(id: number, payload: PersonPayload) {
  const body = mapPayloadToApi(payload);
  const { data } = await api.put<ApiPerson>(`${PEOPLE_ENDPOINT}/${id}`, body, withAuth());
  return mapApiPerson(data);
}

export async function deletePerson(id: number) {
  await api.delete(`${PEOPLE_ENDPOINT}/${id}`, withAuth());
}

export async function restorePerson(id: number) {
  const { data } = await api.post<ApiPerson>(
    `${withTrailingSlash(PEOPLE_ENDPOINT)}${id}/restore`,
    undefined,
    withAuth(),
  );
  return mapApiPerson(data);
}

export async function getAllPeople() {
  const { data } = await api.get<PaginatedResponse<ApiPerson>>(withTrailingSlash(PEOPLE_ENDPOINT), withAuth({
    params: {
      page: 1,
      page_size: 1000,
    },
  }));
  const normalized = normalizePaginatedResponse(data);
  return normalized.items.map(mapApiPerson);
}
