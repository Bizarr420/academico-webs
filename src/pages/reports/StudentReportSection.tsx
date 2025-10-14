import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import TrendChart from '@/app/components/TrendChart';
import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import type { StudentReportSummary } from '@/app/types';
import { getStudentReport } from '@/app/services/reports';

const createInitialFilters = (): BaseFilterValues => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
});

export default function StudentReportSection() {
  const [filters, setFilters] = useState<BaseFilterValues>(createInitialFilters);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [debouncedStudentId, setDebouncedStudentId] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedStudentId(studentIdInput.trim());
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [studentIdInput]);

  const studentId = useMemo(() => {
    const parsed = Number(debouncedStudentId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [debouncedStudentId]);

  const queryEnabled =
    typeof filters.periodo_id === 'number' && typeof filters.materia_id === 'number' && studentId !== null;

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['reports', 'student', filters.periodo_id, filters.materia_id, studentId],
    queryFn: () =>
      getStudentReport({
        periodo_id: filters.periodo_id ?? undefined,
        materia_id: filters.materia_id ?? undefined,
        estudiante_id: studentId!,
      }),
    enabled: queryEnabled,
  });

  const summary: StudentReportSummary | null = data ?? null;

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Reporte por estudiante</h2>
        <p className="text-sm text-gray-500">
          Consulta indicadores y evolución de calificaciones para un estudiante específico.
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <BaseAcademicFilters
          values={filters}
          onChange={handleFiltersChange}
          showTeacher={false}
          showSearch={false}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600" htmlFor="student-report-id">
              ID de estudiante
            </label>
            <input
              id="student-report-id"
              className="border rounded px-3 py-2"
              placeholder="Ej. 1024"
              value={studentIdInput}
              onChange={(event) => setStudentIdInput(event.target.value)}
            />
          </div>
        </div>

        {!queryEnabled && (
          <p className="text-sm text-gray-500">
            Selecciona periodo, materia e ingresa el ID del estudiante para generar el reporte.
          </p>
        )}

        {queryEnabled && isLoading && <p className="text-sm text-gray-500">Generando reporte…</p>}

        {queryEnabled && isError && (
          <p className="text-sm text-red-600">No se pudo obtener el reporte del estudiante.</p>
        )}

        {summary && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">{summary.estudiante}</h3>
                <p className="text-sm text-gray-500">
                  Materia: {summary.materia} · Promedio: {summary.promedio.toFixed(2)}
                </p>
              </div>
              {isFetching && <p className="text-xs text-gray-400">Actualizando…</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {summary.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border px-4 py-3 bg-gray-50">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{kpi.value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Tendencia de calificaciones</h4>
              <TrendChart data={summary.tendencia} />
            </div>

            {summary.series?.comparativo && summary.series.comparativo.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Comparativa del curso</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.series.comparativo.map((point) => (
                    <div key={point.periodo} className="rounded-lg border px-3 py-2 bg-white">
                      <div className="text-sm font-semibold text-gray-800">{point.periodo}</div>
                      <div className="text-xs text-gray-500">{point.nota.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

