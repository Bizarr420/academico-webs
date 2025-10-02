import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import StatusBadge from '@/app/components/StatusBadge';
import { formatDateTime } from '@/app/utils/dates';
import { resolveStatus } from '@/app/utils/status';
import { deletePerson, getPeople, PEOPLE_PAGE_SIZE, restorePerson } from '@/app/services/people';
import { SEX_LABELS } from '@/app/types';
import type { Person } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilterOption = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  TODOS: 'Todos',
  ACTIVO: 'Activos',
  INACTIVO: 'Inactivos',
};

export default function PeopleList() {
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
    queryKey: ['people', page, debouncedSearch, statusFilter, showInactive],
    queryFn: async () =>
      getPeople({
        page,
        search: debouncedSearch || undefined,
        page_size: PEOPLE_PAGE_SIZE,
        estado: estadoFilter,
        incluir_inactivos: includeInactive,
      }),
    placeholderData: (previousData) => previousData,
  });

  const people: Person[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? PEOPLE_PAGE_SIZE;
  const total = data?.total ?? 0;
  const isEmpty = !isLoading && !isError && people.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = people.length < pageSize || isFetching;

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
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
    mutationFn: async (id: number) => restorePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
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

  const formatFullName = (person: Person) => `${person.apellidos} ${person.nombres}`.trim();

  const formatBirthDate = (value: string | null) => {
    if (!value) {
      return '-';
    }
    return value.slice(0, 10);
  };

  const formatSex = (value: Person['sexo']) => {
    if (!value) {
      return '-';
    }
    return SEX_LABELS[value];
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-lg font-semibold">Personas</h1>
        <Link to="/personas/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nueva persona
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="people-search">
            Buscar
          </label>
          <input
            id="people-search"
            placeholder="Buscar por nombre o CI…"
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
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="people-status-filter">
              Estado
            </label>
            <select
              id="people-status-filter"
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
      {isError && <p className="text-red-600">Error al cargar las personas.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron personas.</p>}

      {people.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">CI</th>
                <th>Nombre</th>
                <th>Sexo</th>
                <th>Fecha de nacimiento</th>
                <th>Celular</th>
                <th>Estado</th>
                <th>Desactivado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const status = resolveStatus({ estado: person.estado ?? undefined, activo: person.activo });
                const isInactive = status.isActive === false;
                const deletedAt = person.eliminado_en ? formatDateTime(person.eliminado_en) : '—';

                return (
                  <tr key={person.id} className="border-b last:border-0">
                    <td className="py-2">{person.ci_numero || '-'}</td>
                    <td>{formatFullName(person)}</td>
                    <td>{formatSex(person.sexo)}</td>
                    <td>{formatBirthDate(person.fecha_nacimiento)}</td>
                    <td>{person.celular || '-'}</td>
                    <td>
                      <StatusBadge estado={person.estado ?? undefined} activo={person.activo ?? undefined} />
                    </td>
                    <td>
                      {person.eliminado_en ? (
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
                            to={`/personas/${person.id}/editar`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Editar
                          </Link>
                        )}
                        {isInactive && (
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:underline disabled:opacity-50"
                            onClick={() => handleRestore(person.id)}
                            disabled={restoreMutation.isPending}
                          >
                            Restaurar
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => handleDeactivate(person.id)}
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
