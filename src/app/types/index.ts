export type Role = 'admin' | 'docente' | 'padre' | (string & {});

export type ApiRole =
  | Role
  | 'ADMIN'
  | 'ADMINISTRADOR'
  | 'Administrador'
  | 'Docente'
  | 'DOCENTE'
  | 'Padre'
  | 'PADRE'
  | null
  | undefined;

export const VIEW_CODES = [
  'USUARIOS',
  'ROLES',
  'DOCENTES',
  'ASIGNACIONES',
  'ALERTAS',
  'NOTAS',
  'CURSOS',
  'PLANES',
  'MATRICULAS',
  'MATERIAS',
  'NIVELES',
  'GESTIONES',
  'PARALELOS',
  'REPORTES',
  'ASISTENCIAS',
  'AUDITORIA',
] as const;

export type KnownViewCode = (typeof VIEW_CODES)[number];
export type ViewCode = KnownViewCode | (string & {});

export interface RoleSummary {
  id: number;
  nombre: string;
  codigo: string;
}

export interface ApiView {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
}

export interface View {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
}

export interface User {
  id: number;
  name: string;
  username?: string | null;
  email?: string | null;
  role: Role | null;
  roles: Role[];
  vistas: View[];
}

export interface ApiUser extends Omit<User, 'role' | 'roles' | 'vistas'> {
  role?: ApiRole | null;
  roles?: ApiRole[] | null;
  vistas?: (ApiView | View)[] | null;
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

export interface LegacyPaginated<TItem> {
  items?: TItem[];
  results?: TItem[];
  data?: TItem[];
  total?: number;
  count?: number;
  page?: number;
  current_page?: number;
  page_size?: number;
  per_page?: number;
}

export type PaginatedResponse<TItem> = Paginated<TItem> | TItem[] | LegacyPaginated<TItem>;

export interface PaginationFilters {
  page: number;
  search?: string;
  page_size?: number;
}

export interface SoftDeleteMetadata {
  estado?: string | null;
  activo?: boolean | null;
  eliminado_en?: string | null;
}

export interface ActivableFilters {
  estado?: string;
  incluir_inactivos?: boolean;
  activo?: boolean;
}

export const STUDENT_SITUATIONS = ['REGULAR', 'RETIRADO', 'EGRESADO', 'CONDICIONAL'] as const;
export type StudentSituation = (typeof STUDENT_SITUATIONS)[number];

export const STUDENT_STATES = ['ACTIVO', 'INACTIVO'] as const;
export type StudentStatus = (typeof STUDENT_STATES)[number];

export const STUDENT_SITUATION_LABELS: Record<StudentSituation, string> = {
  REGULAR: 'Regular',
  RETIRADO: 'Retirado',
  EGRESADO: 'Egresado',
  CONDICIONAL: 'Condicional',
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

export interface Student extends SoftDeleteMetadata {
  id: number;
  persona_id: number;
  codigo_rude: string;
  anio_ingreso: number | null;
  situacion: StudentSituation | null;
  estado: StudentStatus | null;
  persona?: Person | null;
}

type PersonAssociationPayload =
  | {
      persona_id: number;
      persona?: never;
    }
  | {
      persona_id?: never;
      persona: PersonPayload;
    };

export type StudentPayload = PersonAssociationPayload & {
  codigo_rude: string;
  anio_ingreso?: number | null;
  situacion?: StudentSituation | null;
  estado?: StudentStatus | null;
};

export interface StudentFilters extends PaginationFilters, ActivableFilters {
  codigo_rude?: string;
}

export const SEX_CODES = ['M', 'F', 'X'] as const;
export type Sexo = (typeof SEX_CODES)[number];
export const SEX_LABELS: Record<Sexo, string> = {
  M: 'Masculino',
  F: 'Femenino',
  X: 'Otro',
};

export interface ApiPerson extends SoftDeleteMetadata {
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

export interface Person extends SoftDeleteMetadata {
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

export type PersonFilters = PaginationFilters & ActivableFilters;

export interface Teacher extends SoftDeleteMetadata {
  id: number;
  persona_id: number;
  titulo: string | null;
  profesion: string | null;
  persona?: Person | null;
}

export type TeacherPayload = PersonAssociationPayload & {
  titulo?: string | null;
  profesion?: string | null;
};

export type TeacherFilters = PaginationFilters & ActivableFilters;

export interface Level {
  id: number;
  nombre: string;
  etiqueta: string | null;
}

export interface CourseParallel {
  id: number;
  nombre: string | null;
  etiqueta: string | null;
}

export interface Course extends SoftDeleteMetadata {
  id: number;
  nombre: string;
  etiqueta: string | null;
  nivel_id: number | null;
  nivel: string | null;
  grado?: number | null;
  paralelos?: CourseParallel[];
  materias?: Subject[];
}

export interface CoursePayload {
  nombre: string;
  etiqueta: string;
  nivel_id: number;
  grado?: number | null;
}

export type CourseFilters = PaginationFilters & ActivableFilters;

export interface Subject extends SoftDeleteMetadata {
  id: number;
  nombre: string;
  codigo: string;
  curso_id: number;
  curso?: string | null;
  paralelo?: string | null;
  area?: string | null;
  estado?: string | null;
  descripcion?: string | null;
}

export interface SubjectPayload {
  nombre: string;
  codigo: string;
  curso_id: number;
  descripcion?: string | null;
  area?: string | null;
  estado?: string | null;
}

export interface SubjectFilters extends PaginationFilters, ActivableFilters {
  curso_id?: number;
}

export interface ManagedUser extends SoftDeleteMetadata {
  id: number;
  username: string;
  name?: string | null;
  email?: string | null;
  role: Role | null;
  roles: Role[];
  persona?: Person | null;
  persona_id?: number | null;
  rol_id?: number | null;
}

export interface ApiManagedUser extends Omit<ManagedUser, 'role' | 'roles'> {
  role?: ApiRole | null;
  roles?: ApiRole[] | null;
}

export interface UserPayload {
  username: string;
  persona_id: number;
  email?: string;
  password?: string;
  rol_id: number;
}

export interface UserFilters extends PaginationFilters, ActivableFilters {
  role?: Role | null;
}

export interface ApiAuditLogEntry {
  id: number;
  accion: string;
  recurso: string;
  usuario: string;
  fecha: string;
  dispositivo?: string | null;
  ip?: string | null;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  resource: string;
  actor: string;
  timestamp: string;
  device?: string | null;
  ip?: string | null;
}

export type AuditLogFilters = PaginationFilters;
