import type { ApiPerson, Person } from '@/app/types';

export const mapApiPerson = (person: ApiPerson): Person => ({
  id: person.id,
  nombres: person.nombres,
  apellidos: person.apellidos,
  sexo: person.sexo ?? null,
  fecha_nacimiento: person.fecha_nacimiento ?? null,
  celular: person.celular ?? null,
  direccion: person.direccion ?? null,
  ci_numero: person.ci?.ci_numero ?? person.ci_numero ?? null,
  ci_complemento: person.ci?.ci_complemento ?? person.ci_complemento ?? null,
  ci_expedicion: person.ci?.ci_expedicion ?? person.ci_expedicion ?? null,
  correo: person.correo ?? null,
  estado: person.estado ?? null,
  activo: person.activo ?? null,
  eliminado_en: person.eliminado_en ?? null,
});
