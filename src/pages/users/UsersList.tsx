import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import StatusBadge from '@/app/components/StatusBadge';
// import { formatDateTime } from '@/app/utils/dates';
import { resolveStatus } from '@/app/utils/status';
import { deactivateUser, activateUser, getUsers, USERS_PAGE_SIZE } from '@/app/services/users';
import ConfirmModal from '@/app/components/ConfirmModal';
import { getAllRoles } from '@/app/services/roles';
import type { ManagedUser } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilterOption = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  TODOS: 'Todos',
  ACTIVO: 'Activos',
  INACTIVO: 'Inactivos',
};

const formatRoleLabel = (user: ManagedUser) => {
  if (user.rol && typeof user.rol === 'object' && user.rol.nombre) {
    return user.rol.nombre;
  }
  return 'Sin rol';
};

export default function UsersList() {
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<number | ''>('');
  const rolesQuery = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => getAllRoles(),
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Eliminado showInactive, ya no se usa
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

  // Eliminado efecto relacionado con showInactive

  const includeInactive = statusFilter !== 'ACTIVO';
  const estadoFilter = statusFilter === 'TODOS' ? undefined : statusFilter;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['users', page, debouncedSearch, statusFilter, roleFilter],
    queryFn: async () => {
      const filters: any = {
        page,
        search: debouncedSearch || undefined,
        page_size: USERS_PAGE_SIZE,
        estado: estadoFilter,
        incluir_inactivos: includeInactive,
      };
      if (roleFilter !== '') {
        filters.rol_id = roleFilter;
      }
      console.log('Filtros enviados a getUsers:', filters);
      return getUsers(filters);
    },
    placeholderData: (previousData) => previousData,
  });

  const users: ManagedUser[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? USERS_PAGE_SIZE;
  const total = data?.total ?? 0;
  const isEmpty = !isLoading && !isError && users.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = users.length < pageSize || isFetching;

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({
        type: 'success',
        message: "Registro desactivado. Puedes restaurarlo desde ‘Mostrar inactivos’.",
      });
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo desactivar el registro.' });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({ type: 'success', message: 'Registro restaurado y activo.' });
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo restaurar el registro.' });
    },
  });

  const handleDeactivate = (id: number) => {
    setConfirmDeactivateId(id);
  };

  const handleActivate = (id: number) => {
    setConfirmRestoreId(id);
  };

  const handleConfirmDeactivate = () => {
    if (confirmDeactivateId !== null) {
      setFeedback(null);
      deactivateMutation.mutate(confirmDeactivateId);
      setConfirmDeactivateId(null);
    }
  };

  const handleCancelDeactivate = () => {
    setConfirmDeactivateId(null);
  };

  const handleConfirmRestore = () => {
    if (confirmRestoreId !== null) {
      setFeedback(null);
      activateMutation.mutate(confirmRestoreId);
      setConfirmRestoreId(null);
    }
  };

  const handleCancelRestore = () => {
    setConfirmRestoreId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-lg font-semibold">Usuarios</h1>
        <Link to="/usuarios/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo usuario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="users-search">
            Buscar
          </label>
          <input
            id="users-search"
            placeholder="Buscar por usuario o correo…"
            className="border rounded px-3 py-2 w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="users-status-filter">
            Estado
          </label>
          <select
            id="users-status-filter"
            className="border rounded px-3 py-2 w-full"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilterOption);
              setPage(1);
            }}
          >
            {(['TODOS', 'ACTIVO', 'INACTIVO'] as StatusFilterOption[]).map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="users-role-filter">
            Rol
          </label>
          <select
            id="users-role-filter"
            className="border rounded px-3 py-2 w-full"
            value={roleFilter}
            onChange={(event) => {
              const value = event.target.value;
              setRoleFilter(value === '' ? '' : Number(value));
              setPage(1);
            }}
            disabled={rolesQuery.isLoading}
          >
            <option value="">Todos los roles…</option>
            {rolesQuery.data?.map((role) => (
              <option key={role.id} value={role.id}>{role.nombre}</option>
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
      {isError && <p className="text-red-600">Error al cargar los usuarios.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron usuarios.</p>}

      {users.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Usuario</th>
                <th>Rol</th>
                <th>Persona</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const personaLabel = user.persona
                  ? `${user.persona.apellidos} ${user.persona.nombres}`.trim()
                  : user.name ?? '-';
                const status = resolveStatus({ estado: user.estado ?? undefined, activo: user.activo });
                const isInactive = status.isActive === false;
                // Eliminado deletedAt, ya no se usa

                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2">{user.username}</td>
                    <td>{formatRoleLabel(user)}</td>
                    <td>{personaLabel}</td>
                    <td>
                      <StatusBadge estado={user.estado ?? undefined} activo={user.activo ?? undefined} />
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        {isInactive ? (
                          <span className="text-sm text-gray-400" title="Restaura el registro para habilitar la edición">
                            Editar
                          </span>
                        ) : (
                          <Link
                            to={`/usuarios/${user.id}/editar`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Editar
                          </Link>
                        )}
                        {isInactive ? (
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:underline disabled:opacity-50"
                            onClick={() => handleActivate(user.id)}
                            disabled={activateMutation.isPending}
                          >
                            Restaurar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                            onClick={() => handleDeactivate(user.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            Desactivar
                          </button>
                        )}
      <ConfirmModal
        open={confirmDeactivateId !== null}
        title="Desactivar usuario"
        message="¿Desactivar registro? Este registro no se eliminará y podrás restaurarlo desde el filtro de estado."
        confirmText="Desactivar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeactivate}
        onCancel={handleCancelDeactivate}
      />
      <ConfirmModal
        open={confirmRestoreId !== null}
        title="Restaurar usuario"
        message="¿Restaurar este usuario? El registro volverá a estar activo."
        confirmText="Restaurar"
        cancelText="Cancelar"
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
      />
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
