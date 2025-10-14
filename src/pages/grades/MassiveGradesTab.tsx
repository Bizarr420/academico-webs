import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import type {
  GradeMassiveDraft,
  GradeMassiveMapping,
  GradeMassivePreview,
  GradeMassiveResult,
} from '@/app/types';
import {
  confirmMassiveGradeUpload,
  previewMassiveGradeUpload,
  startMassiveGradeUpload,
} from '@/app/services/grades';
import { resolveApiErrorMessage } from '@/app/utils/errors';

const createInitialFilters = (): BaseFilterValues => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
});

type Step = 1 | 2 | 3;

export default function MassiveGradesTab() {
  const [filters, setFilters] = useState<BaseFilterValues>(createInitialFilters);
  const [step, setStep] = useState<Step>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<GradeMassiveDraft | null>(null);
  const [mapping, setMapping] = useState<GradeMassiveMapping | null>(null);
  const [preview, setPreview] = useState<GradeMassivePreview | null>(null);
  const [result, setResult] = useState<GradeMassiveResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Selecciona un archivo de notas.');
      }

      if (
        typeof filters.periodo_id !== 'number' ||
        typeof filters.curso_id !== 'number' ||
        typeof filters.materia_id !== 'number'
      ) {
        throw new Error('Selecciona periodo, curso y materia antes de continuar.');
      }

      return startMassiveGradeUpload({
        file: selectedFile,
        periodo_id: filters.periodo_id,
        curso_id: filters.curso_id,
        paralelo_id: filters.paralelo_id ?? null,
        materia_id: filters.materia_id,
      });
    },
    onSuccess: (data) => {
      setDraft(data);
      setMapping(null);
      setPreview(null);
      setResult(null);
      setStep(2);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo cargar el archivo.'));
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (currentMapping: GradeMassiveMapping) => {
      if (!draft) {
        throw new Error('No hay una carga pendiente.');
      }

      return previewMassiveGradeUpload(draft.upload_id, currentMapping);
    },
    onSuccess: (data) => {
      setPreview(data);
      setResult(null);
      setStep(3);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo generar la vista previa.'));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error('No hay una carga pendiente.');
      }

      return confirmMassiveGradeUpload(draft.upload_id);
    },
    onSuccess: (data) => {
      setResult(data);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo confirmar la carga masiva.'));
    },
  });

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setStep(1);
    setDraft(null);
    setPreview(null);
    setMapping(null);
    setResult(null);
    setErrorMessage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleMappingChange = (evaluationId: number) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const column = event.target.value || '';
      setMapping((prev) => ({
        identificador_estudiante: prev?.identificador_estudiante ?? '',
        evaluaciones: {
          ...(prev?.evaluaciones ?? {}),
          [evaluationId]: column,
        },
      }));
    };

  const handleStudentColumnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const column = event.target.value || '';
    setMapping((prev) => ({
      identificador_estudiante: column,
      evaluaciones: prev?.evaluaciones ?? {},
    }));
  };

  const canPreview = useMemo(() => {
    if (!draft || !mapping) {
      return false;
    }

    if (!mapping.identificador_estudiante) {
      return false;
    }

    return draft.evaluaciones.every((evaluation) => mapping.evaluaciones?.[evaluation.id]);
  }, [draft, mapping]);

  const columns = draft?.columns ?? [];

  const resetFlow = () => {
    setStep(1);
    setDraft(null);
    setPreview(null);
    setMapping(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showSearch={false} />

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Carga masiva</h2>
          <p className="text-sm text-gray-500">Paso {step} de 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600" htmlFor="grades-file">
                Archivo CSV o XLSX
              </label>
              <input id="grades-file" type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
              <p className="text-xs text-gray-500">Asegúrate de que el archivo contenga encabezados claros.</p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !selectedFile}
            >
              {uploadMutation.isPending ? 'Procesando…' : 'Subir y analizar'}
            </button>
          </div>
        )}

        {step === 2 && draft && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Mapea las columnas</h3>
              <p className="text-sm text-gray-500">
                Indica qué columna corresponde al identificador del estudiante y a cada evaluación.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600" htmlFor="mapping-student">
                  Columna de estudiante
                </label>
                <select
                  id="mapping-student"
                  className="border rounded px-3 py-2"
                  value={mapping?.identificador_estudiante ?? ''}
                  onChange={handleStudentColumnChange}
                >
                  <option value="">Selecciona una columna…</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
              {draft.evaluaciones.map((evaluation) => (
                <div key={evaluation.id} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600" htmlFor={`mapping-${evaluation.id}`}>
                    {evaluation.nombre}
                  </label>
                  <select
                    id={`mapping-${evaluation.id}`}
                    className="border rounded px-3 py-2"
                    value={mapping?.evaluaciones?.[evaluation.id] ?? ''}
                    onChange={handleMappingChange(evaluation.id)}
                  >
                    <option value="">Selecciona una columna…</option>
                    {columns.map((column) => (
                      <option key={`${evaluation.id}-${column}`} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300"
                onClick={() => {
                  setStep(1);
                  setDraft(null);
                  setPreview(null);
                  setMapping(null);
                }}
              >
                Regresar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
                onClick={() => mapping && previewMutation.mutate(mapping)}
                disabled={!canPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Generando…' : 'Generar vista previa'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && preview && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-gray-700">Vista previa</h3>
                <p className="text-sm text-gray-500">
                  Revisa la información antes de confirmar. Puedes regresar para ajustar el mapeo.
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <span className="mr-4">Insertados: {preview.insertados}</span>
                <span className="mr-4">Actualizados: {preview.actualizados}</span>
                <span>Errores: {preview.errores.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Estudiante</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.filas.map((row) => (
                    <tr key={row.fila} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{row.fila}</td>
                      <td className="px-3 py-2">{row.estudiante}</td>
                      <td className="px-3 py-2 capitalize">{row.estado}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {row.errores && row.errores.length > 0
                          ? row.errores.join('; ')
                          : Object.entries(row.notas)
                              .map(([evaluation, value]) => `${evaluation}: ${value ?? '—'}`)
                              .join(' | ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300"
                onClick={() => {
                  setStep(2);
                  setResult(null);
                }}
              >
                Regresar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? 'Cargando…' : 'Confirmar carga'}
              </button>
            </div>

            {result && (
              <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
                <p>Carga completada.</p>
                <p>
                  Insertados: {result.insertados} · Actualizados: {result.actualizados} · Errores:{' '}
                  {result.errores.length}
                </p>
                {result.errores.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-green-800">
                    {result.errores.slice(0, 5).map((error) => (
                      <li key={error.fila}>
                        Fila {error.fila}: {error.mensaje}
                      </li>
                    ))}
                    {result.errores.length > 5 && <li>Revisa el detalle completo en el archivo de errores.</li>}
                  </ul>
                )}
                <button
                  type="button"
                  className="mt-3 px-4 py-2 rounded border border-gray-300"
                  onClick={resetFlow}
                >
                  Iniciar una nueva carga
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

