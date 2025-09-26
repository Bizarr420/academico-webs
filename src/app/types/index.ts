export type Role = 'admin' | 'docente' | 'padre';

export type ApiRole =
  | Role
  | 'ADMIN'
  | 'ADMINISTRADOR'
  | 'Administrador'
  | 'Docente'
  | 'DOCENTE'
  | 'Padre'
  | 'PADRE';

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface ApiUser extends Omit<User, 'role'> {
  role: ApiRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer' | string;
  user: ApiUser;
}

export interface Paginated<TItem> {
  items: TItem[];
  total: number;
  page: number;
  page_size: number;
}

export type PaginatedResponse<TItem> = Paginated<TItem> | TItem[];

export interface PaginationFilters {
  page: number;
  search?: string;
  page_size?: number;
}

export interface Student {
  id: number;
  ci: string | null;
  nombres: string;
  apellidos: string;
  curso: string | null;
}

export interface StudentPayload {
  ci: string;
  nombres: string;
  apellidos: string;
  curso: string;
}

export type StudentFilters = PaginationFilters;

export const SEX_CODES = ['M', 'F', 'X'] as const;
export type Sexo = (typeof SEX_CODES)[number];
export const SEX_LABELS: Record<Sexo, string> = {
  M: 'Masculino',
  F: 'Femenino',
  X: 'Otro',
};

export interface ApiPerson {
  id: number;
  nombres: string;
  apellidos: string;
  sexo?: Sexo | null;
  fecha_nacimiento?: string | null;
  celular?: string | null;
  direccion?: string | null;
  ci_numero?: string | null;
  ci_complemento?: string | null;
  ci_expedicion?: string | null;
  correo?: string | null;
}

export interface Person {
  id: number;
  nombres: string;
  apellidos: string;
  sexo: Sexo | null;
  fecha_nacimiento: string | null;
  celular: string | null;
  direccion: string | null;
  ci_numero: string | null;
  ci_complemento: string | null;
  ci_expedicion: string | null;
  correo?: string | null;
}

export interface PersonPayload {
  nombres: string;
  apellidos: string;
  sexo: Sexo;
  fecha_nacimiento: string;
  celular: string;
  direccion?: string;
  ci_numero?: string;
  ci_complemento?: string;
  ci_expedicion?: string;
}

export type PersonFilters = PaginationFilters;

export interface TeacherSubject {
  id: number;
  nombre: string;
  curso: string;
}

export interface Teacher {
  id: number;
  ci: string | null;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  materias?: TeacherSubject[];
}

export interface TeacherPayload {
  ci: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  materia_ids: number[];
}

export type TeacherFilters = PaginationFilters;

export interface Course {
  id: number;
  nombre: string;
  paralelo: string;
  nivel: string | null;
  materias?: Subject[];
}

export interface CoursePayload {
  nombre: string;
  paralelo: string;
  nivel?: string;
}

export type CourseFilters = PaginationFilters;

export interface Subject {
  id: number;
  nombre: string;
  curso_id: number;
  curso?: string;
  paralelo?: string;
}

export interface SubjectPayload {
  nombre: string;
  curso_id: number;
}

export interface SubjectFilters extends PaginationFilters {
  curso_id?: number;
}

export interface ManagedUser {
  id: number;
  username: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  persona?: Person | null;
  persona_id?: number | null;
}

export interface ApiManagedUser extends Omit<ManagedUser, 'role'> {
  role: ApiRole;
}

export interface UserPayload {
  username: string;
  role: Role;
  persona_id: number;
  email?: string;
  password?: string;
}

export interface UserFilters extends PaginationFilters {
  role?: Role;
}
