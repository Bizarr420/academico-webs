export type Role = 'admin' | 'docente' | 'padre';

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer' | string;
  user: User;
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

export interface Teacher {
  id: number;
  ci: string | null;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
}

export interface TeacherPayload {
  ci: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
}

export type TeacherFilters = PaginationFilters;
