import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import type { StudentGradeRow } from '@/app/types';
import { getUnitaryGrades, saveUnitaryGrades } from '@/app/services/grades';
import { resolveApiErrorMessage } from '@/app/utils/errors';

const createInitialFilters = (): BaseFilterValues => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
});

const buildKey = (studentId: number, evaluationId: number) => `${studentId}-${evaluationId}`;

const normalizeValue = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

type GradeMap = Record<string, string>;

export default function UnitaryGradesTab() {
  const [filters, setFilters] = useState<BaseFilterValues>(createInitialFilters);
  const [gradeMap, setGradeMap] = useState<GradeMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryEnabled =
    typeof filters.periodo_id === 'number' &&
    typeof filters.curso_id === 'number' &&
    typeof filters.materia_id === 'number';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'grades',
      'unitary',
      filters.periodo_id,
      filters.curso_id,
      filters.paralelo_id,
      filters.materia_id,
    ],
    queryFn: () =>
      getUnitaryGrades({
        periodo_id: filters.periodo_id ?? undefined,
        curso_id: filters.curso_id ?? undefined,
        paralelo_id: filters.paralelo_id ?? undefined,
        materia_id: filters.materia_id ?? undefined,
      }),
    enabled: queryEnabled,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!data) {
      setGradeMap({});
      return;
    }

    const initial: GradeMap = {};
    data.estudiantes.forEach((row) => {
      row.evaluaciones.forEach((evaluation) => {
        initial[buildKey(row.estudiante_id, evaluation.evaluacion_id)] =
          evaluation.nota !== null && evaluation.nota !== undefined ? String(evaluation.nota) : '';
      });
    });
    setGradeMap(initial);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!queryEnabled || !data) {
        throw new Error('Selecciona periodo, curso y materia.');
      }

      const payload = {
        periodo_id: filters.periodo_id!,
        curso_id: filters.curso_id!,
        paralelo_id: filters.paralelo_id ?? null,
        materia_id: filters.materia_id!,
        calificaciones: data.estudiantes.flatMap((row) =>
          row.evaluaciones.map((evaluation) => ({
            estudiante_id: row.estudiante_id,
            evaluacion_id: evaluation.evaluacion_id,
            nota: normalizeValue(gradeMap[buildKey(row.estudiante_id, evaluation.evaluacion_id)] ?? ''),
          })),
        ),
      };

      const response = await saveUnitaryGrades(payload);
      return response;
    },
    onSuccess: (response) => {
      setFeedback('Calificaciones guardadas correctamente.');
      setErrorMessage(null);
      setGradeMap(() => {
        const map: GradeMap = {};
        response.estudiantes.forEach((row) => {
          row.evaluaciones.forEach((evaluation) => {
            map[buildKey(row.estudiante_id, evaluation.evaluacion_id)] =
              evaluation.nota !== null && evaluation.nota !== undefined ? String(evaluation.nota) : '';
          });
        });
        return map;
      });
      queryClient.invalidateQueries({ queryKey: ['grades', 'unitary'] });
    },
    onError: (error) => {
      setFeedback(null);
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudieron guardar las calificaciones.'));
    },
  });

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setFeedback(null);
    setErrorMessage(null);
  };

  const handleGradeChange = (studentId: number, evaluationId: number) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setGradeMap((prev) => ({ ...prev, [buildKey(studentId, evaluationId)]: value }));
    };

  const rows: StudentGradeRow[] = useMemo(() => data?.estudiantes ?? [], [data?.estudiantes]);
  const evaluations = useMemo(() => data?.evaluaciones ?? [], [data?.evaluaciones]);

  const pendingChanges = useMemo(() => {
    if (!data) {
      return 0;
    }

    let changes = 0;
    data.estudiantes.forEach((row) => {
      row.evaluaciones.forEach((evaluation) => {
        const key = buildKey(row.estudiante_id, evaluation.evaluacion_id);
        const current = gradeMap[key] ?? '';
        const original = evaluation.nota !== null && evaluation.nota !== undefined ? String(evaluation.nota) : '';
        if (current.trim() !== original.trim()) {
          changes += 1;
        }
      });
    });
    return changes;
  }, [data, gradeMap]);

  return (
    <div className="space-y-4">
      <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showSearch={false} />

      {!queryEnabled && (
        <p className="text-sm text-gray-500">Selecciona periodo, curso y materia para comenzar.</p>
      )}

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      {feedback && (
        <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
          {feedback}
        </div>
      )}

      {queryEnabled && isLoading && <p className="text-sm text-gray-500">Cargando estudiantes…</p>}

      {queryEnabled && !isLoading && rows.length === 0 && (
        <p className="text-sm text-gray-500">No hay estudiantes asignados para la combinación seleccionada.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Estudiante</th>
                {evaluations.map((evaluation) => (
                  <th key={evaluation.id} className="px-3 py-2 text-center">
                    <div className="font-medium text-gray-700">{evaluation.nombre}</div>
                    {evaluation.ponderacion !== null && evaluation.ponderacion !== undefined && (
                      <div className="text-xs text-gray-500">{evaluation.ponderacion}%</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.estudiante_id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{row.estudiante}</div>
                    {row.codigo && <div className="text-xs text-gray-500">{row.codigo}</div>}
                  </td>
                  {row.evaluaciones.map((evaluation) => (
                    <td key={evaluation.evaluacion_id} className="px-3 py-2 text-center">
                      <input
                        type="number"
                        className="w-24 border rounded px-2 py-1 text-center"
                        value={gradeMap[buildKey(row.estudiante_id, evaluation.evaluacion_id)] ?? ''}
                        onChange={handleGradeChange(row.estudiante_id, evaluation.evaluacion_id)}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Cambios pendientes: {pendingChanges}
            {isFetching && !isLoading && <span className="ml-2 text-xs text-gray-400">Actualizando…</span>}
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            onClick={() => saveMutation.mutate()}
            disabled={pendingChanges === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando…' : 'Guardar calificaciones'}
          </button>
        </div>
      )}
    </div>
  );
}

