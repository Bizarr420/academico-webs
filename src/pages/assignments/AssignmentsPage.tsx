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

type FilterState = BaseFilterValues & {
  incluir_inactivos: boolean;
};

const createInitialFilters = (): FilterState => ({
  periodo_id: null,
  curso_id: null,
  paralelo_id: null,
  materia_id: null,
  docente_id: null,
  search: '',
  incluir_inactivos: false,
});

export default function AssignmentsPage() {
  const [filters, setFilters] = useState<FilterState>(createInitialFilters);
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
      filters.incluir_inactivos,
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
        incluir_inactivos: filters.incluir_inactivos || undefined,
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
          case 'estado':
            return assignment.activo === false ? 'INACTIVA' : assignment.estado ?? 'ACTIVA';
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
      setFeedback('Asignación archivada correctamente.');
    },
    onError: (error) => {
      setErrorMessage(resolveApiErrorMessage(error, 'No se pudo eliminar la asignación.'));
    },
  });

  const handleDelete = (assignment: Assignment) => {
    if (assignment.activo === false) {
      window.alert('Esta asignación ya se encuentra inactiva.');
      return;
    }

    const confirmed = window.confirm(
      '¿Archivar esta asignación? Podrás volver a activarla desde el backend si es necesario.',
    );
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    deleteMutation.mutate(assignment.id);
  };

  const relationLabel = (value?: string | null) => {
    if (!value) {
      return null;
    }
    const normalized = value.trim();
    if (!normalized || normalized.toUpperCase() === 'ACTIVO') {
      return null;
    }
    return normalized;
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
          {relationLabel(assignment.relaciones?.curso) && (
            <div className="text-xs text-amber-600">
              Estado curso: {relationLabel(assignment.relaciones?.curso)}
            </div>
          )}
          {relationLabel(assignment.relaciones?.paralelo) && (
            <div className="text-xs text-amber-600">
              Estado paralelo: {relationLabel(assignment.relaciones?.paralelo)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'materia',
      header: 'Materia',
      sortable: true,
      render: (assignment) => (
        <div className="space-y-1">
          <div>{assignment.materia ?? '—'}</div>
          {relationLabel(assignment.relaciones?.materia) && (
            <div className="text-xs text-amber-600">
              Estado materia: {relationLabel(assignment.relaciones?.materia)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'docente',
      header: 'Docente',
      sortable: true,
      render: (assignment) => (
        <div className="space-y-1">
          <div>{assignment.docente ?? '—'}</div>
          {relationLabel(assignment.relaciones?.docente) && (
            <div className="text-xs text-amber-600">
              Estado docente: {relationLabel(assignment.relaciones?.docente)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (assignment) => {
        const inactive = assignment.activo === false || Boolean(assignment.eliminado_en);
        const label = inactive
          ? assignment.estado?.toLowerCase() === 'inactivo'
            ? 'Inactiva'
            : 'Archivada'
          : assignment.estado ?? 'Activa';
        const badgeClass = inactive
          ? 'bg-rose-100 text-rose-700'
          : 'bg-emerald-100 text-emerald-700';
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}>
              {label}
            </span>
            {assignment.eliminado_en && (
              <span className="text-[11px] text-gray-500">
                Archivada el {formatDateTime(assignment.eliminado_en)}
              </span>
            )}
          </div>
        );
      },
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
            disabled={assignment.activo === false}
          >
            Editar
          </button>
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={() => handleDelete(assignment)}
            disabled={deleteMutation.isPending || assignment.activo === false}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const handleFiltersChange = (changes: Partial<FilterState>) => {
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
          <div className="space-y-3">
            <BaseAcademicFilters values={filters} onChange={handleFiltersChange} showTeacher />
            {!queryEnabled && (
              <p className="mt-2 text-sm text-gray-500">
                Selecciona al menos un periodo para ver las asignaciones.
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                id="assignments-include-inactive"
                type="checkbox"
                className="h-4 w-4"
                checked={filters.incluir_inactivos}
                onChange={(event) => handleFiltersChange({ incluir_inactivos: event.target.checked })}
              />
              <label htmlFor="assignments-include-inactive">Incluir asignaciones archivadas</label>
            </div>
            {feedback && <p className="text-sm text-green-600">{feedback}</p>}
          </div>
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

