import api from '@/app/services/api';
import type { ApiPerson, Paginated, Person, PersonFilters, PersonPayload } from '@/app/types';

export const PEOPLE_PAGE_SIZE = 10;

const PEOPLE_ENDPOINT = '/personas';

const mapPerson = (person: ApiPerson): Person => {
  const celular = person.celular ?? null;
  const ciNumero = person.ci_numero ?? null;

  return {
    id: person.id,
    nombres: person.nombres,
    apellidos: person.apellidos,
    direccion: person.direccion ?? null,
    telefono: celular,
    correo: person.correo ?? null,
    ci: ciNumero,
    sexo: person.sexo ?? null,
    fecha_nacimiento: person.fecha_nacimiento ?? null,
    celular,
    ci_numero: ciNumero,
    ci_complemento: person.ci_complemento ?? null,
    ci_expedicion: person.ci_expedicion ?? null,
  };
};

const mapPayloadToApi = (payload: PersonPayload) => {
  const body: Record<string, unknown> = {
    nombres: payload.nombres,
    apellidos: payload.apellidos,
    direccion: payload.direccion,
    celular: payload.celular ?? payload.telefono,
    correo: payload.correo,
    sexo: payload.sexo,
    fecha_nacimiento: payload.fecha_nacimiento,
    ci_numero: payload.ci_numero ?? payload.ci,
    ci_complemento: payload.ci_complemento,
    ci_expedicion: payload.ci_expedicion,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, unknown>;
};

export async function getPeople(filters: PersonFilters) {
  const { page, search, page_size = PEOPLE_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<ApiPerson>>(PEOPLE_ENDPOINT, {
    params,
  });
  return {
    ...data,
    items: data.items.map(mapPerson),
  };
}

export async function getPerson(id: number) {
  const { data } = await api.get<ApiPerson>(`${PEOPLE_ENDPOINT}/${id}`);
  return mapPerson(data);
}

export async function createPerson(payload: PersonPayload) {
  const body = mapPayloadToApi(payload);
  const { data } = await api.post<ApiPerson>(PEOPLE_ENDPOINT, body);
  return mapPerson(data);
}

export async function updatePerson(id: number, payload: PersonPayload) {
  const body = mapPayloadToApi(payload);
  const { data } = await api.put<ApiPerson>(`${PEOPLE_ENDPOINT}/${id}`, body);
  return mapPerson(data);
}

export async function deletePerson(id: number) {
  await api.delete(`${PEOPLE_ENDPOINT}/${id}`);
}

export async function getAllPeople() {
  const { data } = await api.get<Paginated<ApiPerson>>(PEOPLE_ENDPOINT, {
    params: {
      page: 1,
      page_size: 1000,
    },
  });
  return data.items.map(mapPerson);
}
