import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import DataTable, { type DataTableColumn } from '@/app/components/DataTable';
import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import AssignmentForm from '@/pages/assignments/AssignmentForm';
import { deleteAssignment, getAssignments } from '@/app/services/assignments';
import type { Assignment } from '@/app/types';
import { formatDateTime } from '@/app/utils/dates';
import { resolveApiErrorMessage } from '@/app/utils/errors';

const PAGE_SIZE = 10;

const createInitialFilters = (): BaseFilterValues => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
});

export default function AssignmentsPage() {
  const [filters, setFilters] = useState<BaseFilterValues>(createInitialFilters);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'periodo',
    direction: 'asc',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search?.trim() ?? '');
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryEnabled = typeof filters.periodo_id === 'number';

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      'assignments',
      page,
      filters.periodo_id,
      filters.curso_id,
      filters.paralelo_id,
      filters.materia_id,
      filters.docente_id,
      debouncedSearch,
    ],
    queryFn: () =>
      getAssignments({
        page,
        page_size: PAGE_SIZE,
        periodo_id: filters.periodo_id ?? undefined,
        curso_id: filters.curso_id ?? undefined,
        paralelo_id: filters.paralelo_id ?? undefined,
        materia_id: filters.materia_id ?? undefined,
        docente_id: filters.docente_id ?? undefined,
        search: debouncedSearch || undefined,
      }),
    enabled: queryEnabled,
    placeholderData: (previous) => previous,
  });

  const assignments = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? PAGE_SIZE;
  const total = data?.total ?? 0;

  const sortedAssignments = useMemo(() => {
    if (!sort.key) {
      return assignments;
    }

    const sorted = [...assignments];
    sorted.sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const getValue = (assignment: Assignment) => {
        switch (sort.key) {
          case 'periodo':
            return assignment.periodo ?? '';
          case 'curso':
            return `${assignment.curso ?? ''} ${assignment.paralelo ?? ''}`.trim();
          case 'materia':
            return assignment.materia ?? '';
          case 'docente':
            return assignment.docente ?? '';
          case 'actualizado_en':
            return assignment.actualizado_en ?? '';
          default:
            return '';
        }
      };

      const valueA = getValue(a).toString().toLowerCase();
      const valueB = getValue(b).toString().toLowerCase();
      if (valueA < valueB) {
        return -1 * direction;
      }
      if (valueA > valueB) {
        return 1 * direction;
      }
      return 0;
    });
    return sorted;
  }, [assignments, sort]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setFeedback('Asignación eliminada correctamente.');
    },
    onError: (error) => {
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo eliminar la asignación.'));
    },
  });

  const handleDelete = (assignment: Assignment) => {
    const confirmed = window.confirm('¿Eliminar esta asignación? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    deleteMutation.mutate(assignment.id);
  };

  const columns: DataTableColumn<Assignment>[] = [
    {
      key: 'periodo',
      header: 'Periodo',
      sortable: true,
      render: (assignment) => assignment.periodo ?? '—',
    },
    {
      key: 'curso',
      header: 'Curso / paralelo',
      sortable: true,
      render: (assignment) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{assignment.curso ?? '—'}</div>
          <div className="text-xs text-gray-500">{assignment.paralelo ?? 'Sin paralelo'}</div>
        </div>
      ),
    },
    {
      key: 'materia',
      header: 'Materia',
      sortable: true,
      render: (assignment) => assignment.materia ?? '—',
    },
    {
      key: 'docente',
      header: 'Docente',
      sortable: true,
      render: (assignment) => assignment.docente ?? '—',
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      render: (assignment) => {
        const start = assignment.fecha_inicio ? new Date(assignment.fecha_inicio) : null;
        const end = assignment.fecha_fin ? new Date(assignment.fecha_fin) : null;

        if (!start && !end) {
          return '—';
        }

        const format = (value: Date | null) =>
          value ? new Intl.DateTimeFormat('es-BO').format(value) : 'Sin definir';

        return (
          <div className="text-sm text-gray-600">
            {format(start)} – {format(end)}
          </div>
        );
      },
    },
    {
      key: 'actualizado_en',
      header: 'Actualización',
      sortable: true,
      render: (assignment) => (
        <span className="text-xs text-gray-500">{formatDateTime(assignment.actualizado_en)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (assignment) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              setSelectedAssignment(assignment);
              setShowForm(true);
            }}
          >
            Editar
          </button>
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={() => handleDelete(assignment)}
            disabled={deleteMutation.isPending}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
    setFeedback(null);
  };

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSort({ key, direction });
  };

  const handleCreate = () => {
    setSelectedAssignment(null);
    setShowForm(true);
    setFeedback(null);
    setErrorMessage(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setFeedback('Asignación guardada correctamente.');
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={sortedAssignments}
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        sortBy={sort.key}
        sortDirection={sort.direction}
        onSortChange={handleSortChange}
        isLoading={isLoading && queryEnabled}
        isFetching={isFetching}
        error={errorMessage || (isError ? 'No se pudieron cargar las asignaciones.' : null)}
        header={<h1 className="text-lg font-semibold">Asignaciones</h1>}
        actions={
          <button
            type="button"
            className="px-3 py-2 rounded bg-gray-900 text-white"
            onClick={handleCreate}
          >
            Nueva asignación
          </button>
        }
        filters={
          <>
            <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showTeacher />
            {!queryEnabled && (
              <p className="mt-2 text-sm text-gray-500">
                Selecciona al menos un periodo para ver las asignaciones.
              </p>
            )}
            {feedback && <p className="mt-2 text-sm text-green-600">{feedback}</p>}
          </>
        }
        emptyMessage={queryEnabled ? 'No se encontraron asignaciones con los filtros seleccionados.' : 'Selecciona filtros para comenzar.'}
      />

      <AssignmentForm
        open={showForm}
        assignment={selectedAssignment}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
      />
    </div>
  );
}

