import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import DataTable, { type DataTableColumn } from '@/app/components/DataTable';
import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import AlertStatusDialog from '@/pages/alerts/AlertStatusDialog';
import { getAlerts, updateAlertStatus } from '@/app/services/alerts';
import type { Alert, AlertFilters, AlertStatus, AlertCollection } from '@/app/types';
import { ALERT_STATUS_CODES, ALERT_STATUS_LABELS } from '@/app/types';
import { formatDateTime } from '@/app/utils/dates';
import { resolveApiErrorMessage } from '@/app/utils/errors';

const PAGE_SIZE = 10;

type FilterState = BaseFilterValues & {
  estado: AlertStatus | '';
  page_size: number;
};

const createInitialFilters = (): FilterState => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
  estado: '',
  page_size: PAGE_SIZE,
});

export default function AlertsPage() {
  const [filters, setFilters] = useState<FilterState>(createInitialFilters);
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryFilters: AlertFilters = {
    page,
    page_size: filters.page_size,
    periodo_id: filters.periodo_id ?? undefined,
    curso_id: filters.curso_id ?? undefined,
    paralelo_id: filters.paralelo_id ?? undefined,
    search: filters.search ?? undefined,
    estado: filters.estado || undefined,
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      'alerts',
      page,
      filters.periodo_id,
      filters.curso_id,
      filters.paralelo_id,
      filters.estado,
      filters.search,
      filters.page_size,
    ],
    queryFn: () => getAlerts(queryFilters),
    placeholderData: (previous) => previous,
  });

  const collection: AlertCollection | null = data ?? null;
  const alerts = useMemo(() => collection?.items ?? [], [collection?.items]);
  const total = collection?.total ?? 0;
  const pageSize = collection?.page_size ?? filters.page_size ?? PAGE_SIZE;
  const summary = collection?.resumen ?? null;
  const summaryByStatus = summary?.por_estado ?? {};
  const summaryByType = summary?.por_tipo ?? {};
  const observations = collection?.observaciones ?? [];

  const columns: DataTableColumn<Alert>[] = [
    {
      key: 'estudiante',
      header: 'Estudiante',
      render: (alert) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{alert.estudiante}</div>
          <div className="text-xs text-gray-500">{alert.curso ?? 'Sin curso'}</div>
        </div>
      ),
    },
    {
      key: 'motivo',
      header: 'Motivo',
      render: (alert) => (
        <div className="space-y-1">
          <span className="text-sm text-gray-700">{alert.motivo}</span>
          {alert.tipo && <div className="text-xs text-gray-500">Tipo: {alert.tipo}</div>}
          {alert.observacion && (
            <div className="text-xs text-amber-600">Obs.: {alert.observacion}</div>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'center',
      render: (alert) => <span className="font-semibold text-gray-700">{alert.score.toFixed(1)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (alert) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          {ALERT_STATUS_LABELS[alert.estado as keyof typeof ALERT_STATUS_LABELS] ?? alert.estado}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (alert) => <span className="text-xs text-gray-500">{formatDateTime(alert.fecha)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (alert) => (
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => {
            setSelectedAlert(alert);
            setFeedback(null);
            setErrorMessage(null);
          }}
        >
          Cambiar estado
        </button>
      ),
    },
  ];

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: number; status: AlertStatus; comment: string }) =>
      updateAlertStatus(id, { estado: status, observacion: comment, comentario: comment }),
    onSuccess: () => {
      setFeedback('Estado actualizado correctamente.');
      setErrorMessage(null);
      setSelectedAlert(null);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => {
      setFeedback(null);
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo actualizar la alerta.'));
    },
  });

  const handleFiltersChange = (changes: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  };

  const renderSummary = () => {
    if (!summary || (Object.keys(summaryByStatus).length === 0 && Object.keys(summaryByType).length === 0)) {
      return null;
    }

    const statusEntries = Object.entries(summaryByStatus);
    const typeEntries = Object.entries(summaryByType);

    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {statusEntries.length > 0 && (
          <div className="rounded-lg border px-3 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Resumen por estado</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusEntries.map(([code, count]) => (
                <span
                  key={code}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                >
                  {ALERT_STATUS_LABELS[code as keyof typeof ALERT_STATUS_LABELS] ?? code}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
        {typeEntries.length > 0 && (
          <div className="rounded-lg border px-3 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Resumen por tipo</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {typeEntries.map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={alerts}
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        error={errorMessage || (isError ? 'No se pudieron cargar las alertas.' : null)}
        header={<h1 className="text-lg font-semibold">Alertas académicas</h1>}
        filters={
          <div className="space-y-3">
            <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showTeacher={false} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex flex-col gap-1 sm:w-64">
                <label className="text-sm font-medium text-gray-600" htmlFor="alert-status-filter">
                  Estado
                </label>
                <select
                  id="alert-status-filter"
                  className="border rounded px-3 py-2"
                  value={filters.estado}
                  onChange={(event) => handleFiltersChange({ estado: event.target.value as AlertStatus | '' })}
                >
                  <option value="">Todos</option>
                  {ALERT_STATUS_CODES.map((code) => (
                    <option key={code} value={code}>
                      {ALERT_STATUS_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:w-48">
                <label className="text-sm font-medium text-gray-600" htmlFor="alert-page-size">
                  Registros por página
                </label>
                <select
                  id="alert-page-size"
                  className="border rounded px-3 py-2"
                  value={filters.page_size}
                  onChange={(event) => handleFiltersChange({ page_size: Number(event.target.value) || PAGE_SIZE })}
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              {feedback && <p className="text-sm text-green-600">{feedback}</p>}
            </div>
            {renderSummary()}
            {observations.length > 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-medium">Observaciones recientes</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {observations.slice(0, 4).map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        }
        emptyMessage="No se encontraron alertas con los filtros seleccionados."
      />

      <AlertStatusDialog
        alert={selectedAlert}
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        onSubmit={(status, comment) => {
          if (!selectedAlert) {
            return;
          }
          statusMutation.mutate({ id: selectedAlert.id, status, comment });
        }}
      />
    </div>
  );
}

