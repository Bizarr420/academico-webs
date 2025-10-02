import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import StatusBadge from '@/app/components/StatusBadge';
import { formatDateTime } from '@/app/utils/dates';
import { resolveStatus } from '@/app/utils/status';
import { getAllCourses } from '@/app/services/courses';
import {
  deleteSubject,
  getSubjects,
  restoreSubject,
  SUBJECTS_PAGE_SIZE,
} from '@/app/services/subjects';
import type { Course, Subject } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilterOption = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  TODOS: 'Todos',
  ACTIVO: 'Activos',
  INACTIVO: 'Inactivos',
};

const formatCourseLabel = (course: Course) => {
  const paralelos = course.paralelos ?? [];
  const paralelosLabel = paralelos
    .map((parallel) => parallel.nombre || parallel.etiqueta || '')
    .filter((label) => label.trim().length > 0);
  const paraleloDisplay = paralelosLabel.length > 0 ? paralelosLabel.join(', ') : course.etiqueta ?? '';
  const parts = [course.nombre, paraleloDisplay].filter((part) => part && part.trim().length > 0);
  return parts.length > 0 ? parts.join(' - ') : course.nombre;
};

export default function SubjectsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
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
  const cursoIdFilter = selectedCourse ? Number(selectedCourse) : undefined;

  const coursesQuery = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => getAllCourses(),
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['subjects', page, debouncedSearch, selectedCourse, statusFilter, showInactive],
    queryFn: async () =>
      getSubjects({
        page,
        search: debouncedSearch || undefined,
        page_size: SUBJECTS_PAGE_SIZE,
        curso_id: cursoIdFilter,
        estado: estadoFilter,
        incluir_inactivos: includeInactive,
      }),
    placeholderData: (previousData) => previousData,
  });

  const subjects: Subject[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? SUBJECTS_PAGE_SIZE;
  const total = data?.total ?? 0;
  const isEmpty = !isLoading && !isError && subjects.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = subjects.length < pageSize || isFetching;

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
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
    mutationFn: async (id: number) => restoreSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
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
        <h1 className="text-lg font-semibold">Materias</h1>
        <Link to="/materias/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nueva
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="subjects-search">
            Buscar
          </label>
          <input
            id="subjects-search"
            placeholder="Buscar por nombre de materia…"
            className="border rounded px-3 py-2 w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="subjects-course-filter">
            Curso
          </label>
          <select
            id="subjects-course-filter"
            className="border rounded px-3 py-2 w-full"
            value={selectedCourse}
            onChange={(event) => {
              setSelectedCourse(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {coursesQuery.data?.map((course: Course) => (
              <option key={course.id} value={course.id}>
                {formatCourseLabel(course)}
              </option>
            ))}
          </select>
          {coursesQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar los cursos.</p>
          )}
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
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="subjects-status-filter">
              Estado
            </label>
            <select
              id="subjects-status-filter"
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
      {isError && <p className="text-red-600">Error al cargar las materias.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron materias.</p>}

      {subjects.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Materia</th>
                <th>Código</th>
                <th>Curso</th>
                <th>Paralelo</th>
                <th>Estado</th>
                <th>Desactivado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const status = resolveStatus({ estado: subject.estado ?? undefined, activo: subject.activo });
                const isInactive = status.isActive === false;
                const deletedAt = subject.eliminado_en ? formatDateTime(subject.eliminado_en) : '—';

                return (
                  <tr key={subject.id} className="border-b last:border-0">
                    <td className="py-2">{subject.nombre}</td>
                    <td>{subject.codigo || '-'}</td>
                    <td>{subject.curso || '-'}</td>
                    <td>{subject.paralelo || '-'}</td>
                    <td>
                      <StatusBadge estado={subject.estado ?? undefined} activo={subject.activo ?? undefined} />
                    </td>
                    <td>
                      {subject.eliminado_en ? (
                        <span title="fecha de desactivación">{deletedAt}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        {isInactive ? (
                          <span className="text-sm text-gray-400" title="Restaura el registro para habilitar la edición">
                            Editar
                          </span>
                        ) : (
                          <Link
                            to={`/materias/${subject.id}/editar`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Editar
                          </Link>
                        )}
                        {isInactive && (
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:underline disabled:opacity-50"
                            onClick={() => handleRestore(subject.id)}
                            disabled={restoreMutation.isPending}
                          >
                            Restaurar
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => handleDeactivate(subject.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          Desactivar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
