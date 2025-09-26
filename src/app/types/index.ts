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
