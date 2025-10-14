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

export interface Period {
  id: number;
  nombre: string;
  gestion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
  activo?: boolean | null;
}

export interface PeriodFilters extends PaginationFilters {
  estado?: string;
  vigente?: boolean;
}

export interface Assignment extends SoftDeleteMetadata {
  id: number;
  curso_id: number;
  curso?: string | null;
  paralelo_id?: number | null;
  paralelo?: string | null;
  materia_id: number;
  materia?: string | null;
  docente_id: number;
  docente?: string | null;
  periodo_id: number;
  periodo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  actualizado_en?: string | null;
  creado_en?: string | null;
}

export interface AssignmentPayload {
  curso_id: number;
  paralelo_id?: number | null;
  materia_id: number;
  docente_id: number;
  periodo_id: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export interface AssignmentFilters extends PaginationFilters {
  periodo_id?: number;
  curso_id?: number;
  paralelo_id?: number;
  materia_id?: number;
  docente_id?: number;
  search?: string;
}

export interface GradeEvaluation {
  id: number;
  nombre: string;
  ponderacion?: number | null;
}

export interface StudentGradeValue {
  evaluacion_id: number;
  nota: number | null;
  periodo_id: number;
}

export interface StudentGradeRow {
  estudiante_id: number;
  estudiante: string;
  codigo?: string | null;
  evaluaciones: StudentGradeValue[];
}

export interface GradeUnitaryResponse {
  periodo_id: number;
  materia_id: number;
  curso_id: number;
  paralelo_id?: number | null;
  evaluaciones: GradeEvaluation[];
  estudiantes: StudentGradeRow[];
}

export interface GradeUnitaryFilters {
  periodo_id?: number;
  curso_id?: number;
  paralelo_id?: number;
  materia_id?: number;
}

export interface GradeUnitaryPayload {
  periodo_id: number;
  materia_id: number;
  curso_id: number;
  paralelo_id?: number | null;
  calificaciones: {
    estudiante_id: number;
    evaluacion_id: number;
    nota: number | null;
  }[];
}

export interface GradeMassiveDraft {
  upload_id: string;
  columns: string[];
  evaluaciones: GradeEvaluation[];
  registros_detectados?: number;
}

export interface GradeMassiveMapping {
  identificador_estudiante: string;
  evaluaciones: Record<number, string>;
}

export interface GradeMassivePreviewRow {
  fila: number;
  estudiante: string;
  estado: 'inserted' | 'updated' | 'error';
  errores?: string[];
  notas: Record<string, number | null>;
}

export interface GradeMassiveResult {
  insertados: number;
  actualizados: number;
  errores: { fila: number; mensaje: string }[];
}

export interface GradeMassivePreview extends GradeMassiveResult {
  filas: GradeMassivePreviewRow[];
}

export interface StudentReportKpi {
  label: string;
  value: string;
}

export interface StudentReportTrendPoint {
  periodo: string;
  nota: number;
}

export interface StudentReportSummary {
  estudiante: string;
  materia: string;
  promedio: number;
  kpis: StudentReportKpi[];
  tendencia: StudentReportTrendPoint[];
}

export interface StudentReportFilters {
  periodo_id?: number;
  materia_id?: number;
  estudiante_id: number;
}

export interface CourseReportRow {
  curso: string;
  paralelo: string;
  materia: string;
  promedio: number;
  aprobados: number;
  reprobados: number;
}

export interface CourseReportFilters {
  periodo_id?: number;
  curso_id?: number;
  paralelo_id?: number;
  materia_id?: number;
}

export const ALERT_STATUS_CODES = ['ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'] as const;
export type AlertStatus = (typeof ALERT_STATUS_CODES)[number] | (string & {});

export const ALERT_STATUS_LABELS: Record<(typeof ALERT_STATUS_CODES)[number], string> = {
  ABIERTA: 'Abierta',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};

export interface Alert {
  id: number;
  estudiante: string;
  estudiante_id: number;
  curso?: string | null;
  periodo?: string | null;
  motivo: string;
  score: number;
  estado: AlertStatus;
  fecha: string;
  comentario?: string | null;
}

export interface AlertFilters extends PaginationFilters {
  estado?: AlertStatus | '';
  curso_id?: number;
  paralelo_id?: number;
  periodo_id?: number;
  search?: string;
}

export interface AlertStatusPayload {
  estado: AlertStatus;
  comentario?: string | null;
}
