import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import StatusBadge from '@/app/components/StatusBadge';
import { formatDateTime } from '@/app/utils/dates';
import { resolveStatus } from '@/app/utils/status';
import { deleteStudent, getStudents, restoreStudent, STUDENTS_PAGE_SIZE } from '@/app/services/students';
import type { Student } from '@/app/types';
import StudentSummary from '@/pages/students/components/StudentSummary';

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilterOption = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  TODOS: 'Todos',
  ACTIVO: 'Activos',
  INACTIVO: 'Inactivos',
};

export default function StudentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ACTIVO');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!showInactive && statusFilter !== 'ACTIVO') {
      setStatusFilter('ACTIVO');
    } else if (showInactive && statusFilter === 'ACTIVO') {
      setStatusFilter('TODOS');
    }
  }, [showInactive, statusFilter]);

  const includeInactive = showInactive || statusFilter !== 'ACTIVO';
  const estadoFilter = statusFilter === 'TODOS' ? undefined : statusFilter;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['students', page, debouncedSearch, statusFilter, showInactive],
    queryFn: async () =>
      getStudents({
        page,
        search: debouncedSearch || undefined,
        codigo_rude: debouncedSearch || undefined,
        page_size: STUDENTS_PAGE_SIZE,
        estado: estadoFilter,
        incluir_inactivos: includeInactive,
      }),
    placeholderData: (previousData) => previousData,
  });

  const students: Student[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? STUDENTS_PAGE_SIZE;
  const total = data?.total ?? 0;
  const isEmpty = !isLoading && !isError && students.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = students.length < pageSize || isFetching;

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFeedback({
        type: 'success',
        message: "Registro desactivado. Puedes restaurarlo desde ‘Mostrar inactivos’.",
      });
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo desactivar el registro.' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => restoreStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFeedback({ type: 'success', message: 'Registro restaurado y activo.' });
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo restaurar el registro.' });
    },
  });

  const handleDeactivate = (id: number) => {
    const confirmed = window.confirm(
      '¿Desactivar registro? Este registro no se eliminará y podrás restaurarlo desde “Mostrar inactivos”.',
    );
    if (!confirmed) {
      return;
    }
    setFeedback(null);
    deactivateMutation.mutate(id);
  };

  const handleRestore = (id: number) => {
    setFeedback(null);
    restoreMutation.mutate(id);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-lg font-semibold">Estudiantes</h1>
        <Link to="/estudiantes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="students-search">
            Buscar
          </label>
          <input
            id="students-search"
            placeholder="Buscar por código RUDE o persona…"
            className="border rounded px-3 py-2 w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="md:col-span-1 flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={showInactive}
              onChange={(event) => {
                setShowInactive(event.target.checked);
                setPage(1);
              }}
            />
            Mostrar inactivos
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="students-status-filter">
              Estado
            </label>
            <select
              id="students-status-filter"
              className="border rounded px-3 py-2 w-full"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilterOption);
                setPage(1);
              }}
              disabled={!showInactive}
            >
              {(['TODOS', 'ACTIVO', 'INACTIVO'] as StatusFilterOption[]).map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-3 text-sm text-gray-500">Total: {total}</div>

      {feedback && (
        <div
          className={[
            'mb-3 rounded border px-3 py-2 text-sm',
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800',
          ].join(' ')}
        >
          {feedback.message}
        </div>
      )}

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar los estudiantes.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron estudiantes.</p>}

      {students.length > 0 && (
        <>
          <div className="space-y-4">
            {students.map((student) => {
              const status = resolveStatus({ estado: student.estado ?? undefined, activo: student.activo });
              const isInactive = status.isActive === false;
              const deletedAt = student.eliminado_en ? formatDateTime(student.eliminado_en) : null;

              return (
                <div key={student.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <StudentSummary student={student} className="flex-1" />
                    <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
                      <StatusBadge estado={student.estado ?? undefined} activo={student.activo ?? undefined} />
                      {deletedAt && (
                        <span className="text-xs text-gray-500" title="fecha de desactivación">
                          Desactivado el {deletedAt}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isInactive ? (
                      <span className="text-sm text-gray-400" title="Restaura el registro para habilitar la edición">
                        Editar
                      </span>
                    ) : (
                      <Link
                        to={`/estudiantes/${student.id}/editar`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                    {isInactive && (
                      <button
                        type="button"
                        className="text-sm text-green-600 hover:underline disabled:opacity-50"
                        onClick={() => handleRestore(student.id)}
                        disabled={restoreMutation.isPending}
                      >
                        Restaurar
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => handleDeactivate(student.id)}
                      disabled={deactivateMutation.isPending}
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 justify-end mt-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={disablePrevious}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((current) => current + 1)}
              disabled={disableNext}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
