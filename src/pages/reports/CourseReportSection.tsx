import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import TrendChart from '@/app/components/TrendChart';
import type { CourseReportAnalytics, CourseReportRow, StudentReportTrendPoint } from '@/app/types';
import { getCourseReport } from '@/app/services/reports';

const createInitialFilters = (): BaseFilterValues => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
});

const headers = ['Curso', 'Paralelo', 'Materia', 'Promedio', 'Aprobados', 'Reprobados'];

const toCsv = (rows: CourseReportRow[]) => {
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(
      [row.curso, row.paralelo, row.materia, row.promedio.toFixed(2), row.aprobados, row.reprobados]
        .map((value) =>
          typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value,
        )
        .join(','),
    );
  });
  return lines.join('\n');
};

export default function CourseReportSection() {
  const [filters, setFilters] = useState<BaseFilterValues>(createInitialFilters);

  const queryEnabled = typeof filters.periodo_id === 'number' && typeof filters.materia_id === 'number';

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      'reports',
      'course',
      filters.periodo_id,
      filters.curso_id,
      filters.paralelo_id,
      filters.materia_id,
    ],
    queryFn: () =>
      getCourseReport({
        periodo_id: filters.periodo_id ?? undefined,
        curso_id: filters.curso_id ?? undefined,
        paralelo_id: filters.paralelo_id ?? undefined,
        materia_id: filters.materia_id ?? undefined,
      }),
    enabled: queryEnabled,
  });

  const analytics: CourseReportAnalytics | null = data ?? null;
  const rows: CourseReportRow[] = useMemo(() => analytics?.filas ?? [], [analytics?.filas]);
  const resumen = analytics?.resumen ?? { registros: rows.length };
  const metrics = useMemo(() => {
    const derived: { label: string; value: string }[] = [
      {
        label: 'Promedio general',
        value:
          typeof resumen.promedio_general === 'number'
            ? resumen.promedio_general.toFixed(2)
            : rows.length > 0
            ? (rows.reduce((sum, row) => sum + row.promedio, 0) / rows.length).toFixed(2)
            : '—',
      },
      {
        label: 'Aprobados',
        value:
          resumen.aprobados !== null && resumen.aprobados !== undefined
            ? String(resumen.aprobados)
            : rows.length > 0
            ? String(rows.reduce((sum, row) => sum + row.aprobados, 0))
            : '0',
      },
      {
        label: 'Reprobados',
        value:
          resumen.reprobados !== null && resumen.reprobados !== undefined
            ? String(resumen.reprobados)
            : rows.length > 0
            ? String(rows.reduce((sum, row) => sum + row.reprobados, 0))
            : '0',
      },
    ];

    const extra = analytics?.kpis ?? [];
    const usedLabels = new Set(derived.map((metric) => metric.label));
    extra.forEach((metric) => {
      if (!metric?.label || usedLabels.has(metric.label)) {
        return;
      }
      derived.push({ label: metric.label, value: metric.value });
      usedLabels.add(metric.label);
    });

    return derived;
  }, [analytics?.kpis, resumen.aprobados, resumen.promedio_general, resumen.reprobados, rows]);

  const trendPoints: StudentReportTrendPoint[] = useMemo(() => {
    if (!analytics?.series?.tendencia) {
      return [];
    }

    return analytics.series.tendencia.map((point) => ({
      periodo: point.etiqueta,
      nota: typeof point.valor === 'number' ? point.valor : Number(point.valor) || 0,
    }));
  }, [analytics?.series?.tendencia]);

  const approvalBreakdown = analytics?.series?.aprobacion ?? [];

  const csv = useMemo(() => toCsv(rows), [rows]);

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const handleExport = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_curso_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Reporte por curso</h2>
        <p className="text-sm text-gray-500">
          Analiza promedios y resultados generales por curso y materia.
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showSearch={false} />

        {!queryEnabled && (
          <p className="text-sm text-gray-500">Selecciona periodo y materia para generar el reporte.</p>
        )}

        {queryEnabled && isLoading && <p className="text-sm text-gray-500">Generando reporte…</p>}
        {queryEnabled && isError && (
          <p className="text-sm text-red-600">No se pudo generar el reporte por curso.</p>
        )}

        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-gray-600">
                Registros: {resumen.registros ?? rows.length}
                {isFetching && <span className="ml-2 text-xs text-gray-400">Actualizando…</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border border-gray-300"
                  onClick={handleExport}
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border px-4 py-3 bg-gray-50">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{metric.value}</div>
                </div>
              ))}
            </div>

            {trendPoints.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Tendencia de promedios</h3>
                <TrendChart data={trendPoints} />
              </div>
            )}

            {approvalBreakdown.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Detalle de aprobación</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {approvalBreakdown.map((item) => (
                    <div key={item.etiqueta} className="rounded-lg border px-3 py-2">
                      <div className="text-sm font-semibold text-gray-800">{item.etiqueta}</div>
                      <div className="text-xs text-gray-500">
                        {typeof item.valor === 'number' ? item.valor.toFixed(2) : item.valor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">Curso</th>
                    <th className="px-3 py-2">Paralelo</th>
                    <th className="px-3 py-2">Materia</th>
                    <th className="px-3 py-2">Promedio</th>
                    <th className="px-3 py-2">Aprobados</th>
                    <th className="px-3 py-2">Reprobados</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.curso}-${row.paralelo}-${index}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{row.curso}</td>
                      <td className="px-3 py-2">{row.paralelo}</td>
                      <td className="px-3 py-2">{row.materia}</td>
                      <td className="px-3 py-2">{row.promedio.toFixed(2)}</td>
                      <td className="px-3 py-2">{row.aprobados}</td>
                      <td className="px-3 py-2">{row.reprobados}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {queryEnabled && !isLoading && rows.length === 0 && (
          <p className="text-sm text-gray-500">No se encontraron resultados para los filtros seleccionados.</p>
        )}
      </div>
    </section>
  );
}

