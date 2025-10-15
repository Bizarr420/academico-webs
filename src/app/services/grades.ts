import api, { withTrailingSlash } from '@/app/services/api';
import type {
  GradeMassiveDraft,
  GradeMassiveMapping,
  GradeMassivePreview,
  GradeMassiveResult,
  GradeUnitaryFilters,
  GradeUnitaryPayload,
  GradeUnitaryResponse,
} from '@/app/types';

const UNITARY_GRADES_ENDPOINT = 'notas/unitarias';
const MASSIVE_GRADES_ENDPOINT = 'notas/masivas';

const normalizeResult = (result: GradeMassiveResult): GradeMassiveResult => ({
  ...result,
  observaciones: Array.isArray(result.observaciones) ? result.observaciones : [],
  errores: Array.isArray(result.errores)
    ? result.errores.map((error) => ({
        fila: error.fila,
        mensaje: error.mensaje,
      }))
    : [],
});

const normalizePreview = (preview: GradeMassivePreview): GradeMassivePreview => ({
  ...normalizeResult(preview),
  filas: Array.isArray(preview.filas)
    ? preview.filas.map((row) => ({
        ...row,
        errores: Array.isArray(row.errores) ? row.errores : [],
        observacion: row.observacion ?? null,
        notas: row.notas ?? {},
      }))
    : [],
});

export async function getUnitaryGrades(filters: GradeUnitaryFilters) {
  const params: Record<string, unknown> = {};

  if (typeof filters.periodo_id === 'number') {
    params.periodo_id = filters.periodo_id;
  }

  if (typeof filters.materia_id === 'number') {
    params.materia_id = filters.materia_id;
  }

  if (typeof filters.curso_id === 'number') {
    params.curso_id = filters.curso_id;
  }

  if (typeof filters.paralelo_id === 'number') {
    params.paralelo_id = filters.paralelo_id;
  }

  const { data } = await api.get<GradeUnitaryResponse>(withTrailingSlash(UNITARY_GRADES_ENDPOINT), {
    params,
  });

  return data;
}

export async function saveUnitaryGrades(payload: GradeUnitaryPayload) {
  const { data } = await api.post<GradeUnitaryResponse>(withTrailingSlash(UNITARY_GRADES_ENDPOINT), payload);
  return data;
}

type StartMassivePayload = {
  periodo_id: number;
  materia_id: number;
  curso_id: number;
  paralelo_id?: number | null;
  file: File;
};

export async function startMassiveGradeUpload(payload: StartMassivePayload) {
  const formData = new FormData();
  formData.append('periodo_id', String(payload.periodo_id));
  formData.append('materia_id', String(payload.materia_id));
  formData.append('curso_id', String(payload.curso_id));
  if (typeof payload.paralelo_id === 'number') {
    formData.append('paralelo_id', String(payload.paralelo_id));
  }
  formData.append('file', payload.file);

  const { data } = await api.post<GradeMassiveDraft>(withTrailingSlash(MASSIVE_GRADES_ENDPOINT), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}

export async function previewMassiveGradeUpload(uploadId: string, mapping: GradeMassiveMapping) {
  const { data } = await api.post<GradeMassivePreview>(
    `${withTrailingSlash(MASSIVE_GRADES_ENDPOINT)}${uploadId}/preview`,
    mapping,
  );

  return normalizePreview(data);
}

export async function confirmMassiveGradeUpload(uploadId: string) {
  const { data } = await api.post<GradeMassiveResult>(
    `${withTrailingSlash(MASSIVE_GRADES_ENDPOINT)}${uploadId}/confirm`,
  );

  return normalizeResult(data);
}

