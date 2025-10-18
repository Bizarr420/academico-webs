import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import StatusBadge from '@/app/components/StatusBadge';
import { formatDateTime } from '@/app/utils/dates';
import { resolveStatus } from '@/app/utils/status';
import {
  deleteTeacher,
  getTeachers,
  restoreTeacher,
  TEACHERS_PAGE_SIZE,
} from '@/app/services/teachers';
import type { Teacher } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilterOption = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  TODOS: 'Todos',
  ACTIVO: 'Activos',
  INACTIVO: 'Inactivos',
};

export default function TeachersList() {
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
    queryKey: ['teachers', page, debouncedSearch, statusFilter, showInactive],
    queryFn: async () =>
      getTeachers({
        page,
        search: debouncedSearch || undefined,
        page_size: TEACHERS_PAGE_SIZE,
        estado: estadoFilter,
        incluir_inactivos: includeInactive,
      }),
    placeholderData: (previousData) => previousData,
  });

  const teachers: Teacher[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? TEACHERS_PAGE_SIZE;
  const total = data?.total ?? 0;
  const isEmpty = !isLoading && !isError && teachers.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = teachers.length < pageSize || isFetching;

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
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
    mutationFn: async (id: number) => restoreTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
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
        <h1 className="text-lg font-semibold">Docentes</h1>
        <Link to="/docentes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="teachers-search">
            Buscar
          </label>
          <input
            id="teachers-search"
            placeholder="Buscar por persona…"
            className="border rounded px-3 py-2 w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 md:justify-end">
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
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="teachers-status-filter">
            Estado
          </label>
          <select
            id="teachers-status-filter"
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
      {isError && <p className="text-red-600">Error al cargar los docentes.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron docentes.</p>}

      {teachers.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Persona</th>
                <th>Título</th>
                <th>Materias</th>
                <th>Cursos</th>
                <th>Asignaciones</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => {
                const persona = teacher.persona;
                const personaLabel = persona
                  ? [persona.apellidos, persona.nombres]
                      .map((part) => part?.trim?.() ?? '')
                      .filter((part) => part.length > 0)
                      .join(' ')
                  : '';
                const displayName = personaLabel || (persona ? `Persona ${teacher.persona_id}` : 'Sin información');
                const status = resolveStatus({ estado: teacher.estado ?? undefined, activo: teacher.activo });
                const isInactive = status.isActive === false;
                const deletedAt = teacher.eliminado_en ? formatDateTime(teacher.eliminado_en) : '—';

                return (
                  <tr key={teacher.id} className="border-b last:border-0">
                    <td className="py-2">{displayName}</td>
                    <td>{teacher.titulo ?? '-'}</td>
                    <td>
                      {teacher.materias && teacher.materias.length > 0
                        ? teacher.materias.map((m) => m.nombre).join(', ')
                        : <span className="text-gray-400 italic">No tiene asignada materia</span>}
                    </td>
                    <td>
                      {teacher.cursos && teacher.cursos.length > 0
                        ? teacher.cursos.map((c) => c.nombre).join(', ')
                        : <span className="text-gray-400 italic">No tiene asignado curso</span>}
                    </td>
                    <td>
                      {teacher.asignaciones && teacher.asignaciones.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {teacher.asignaciones.map((a) => (
                            <li key={a.id}>
                              <span className="font-semibold">{a.materia.nombre}</span> ({a.materia.codigo})<br />
                              <span>
                                Curso: {a.curso.nombre} [{a.curso.etiqueta}]<br />
                                Paralelo: {a.paralelo.etiqueta}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignaciones</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge estado={teacher.estado ?? undefined} activo={teacher.activo ?? undefined} />
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        {isInactive ? (
                          <span
                            className="text-sm text-gray-400"
                            title="Restaura el registro para habilitar la edición"
                          >
                            Editar
                          </span>
                        ) : (
                          <Link
                            to={`/docentes/${teacher.id}/editar`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Editar
                          </Link>
                        )}
                        {isInactive && (
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:underline disabled:opacity-50"
                            onClick={() => handleRestore(teacher.id)}
                            disabled={restoreMutation.isPending}
                          >
                            Restaurar
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => handleDeactivate(teacher.id)}
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
