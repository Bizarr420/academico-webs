import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deleteUser, getUsers, USERS_PAGE_SIZE } from '@/app/services/users';
import { getRoleOptions } from '@/app/services/roles';
import type { ManagedUser, Role, RoleOption } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

type RoleFilter = Role | 'all';

const formatRoleLabel = (role: Role) => {
  const trimmed = role.trim();
  if (!trimmed) {
    return 'Sin rol';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['users', page, debouncedSearch, roleFilter],
    queryFn: async () =>
      getUsers({
        page,
        search: debouncedSearch || undefined,
        page_size: USERS_PAGE_SIZE,
        role: roleFilter === 'all' ? undefined : roleFilter,
      }),
    placeholderData: (previousData) => previousData,
  });

  const rolesQuery = useQuery({
    queryKey: ['role-options'],
    queryFn: async () => getRoleOptions(),
  });

  useEffect(() => {
    if (roleFilter === 'all') {
      return;
    }
    const options = rolesQuery.data ?? [];
    if (options.every((option) => option.clave !== roleFilter)) {
      setRoleFilter('all');
    }
  }, [roleFilter, rolesQuery.data]);

  const users: ManagedUser[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? USERS_PAGE_SIZE;
  const isEmpty = !isLoading && !isError && users.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = users.length < pageSize || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar este usuario?');
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const roleOptions = useMemo<RoleOption[]>(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const roleNameByKey = useMemo(
    () =>
      roleOptions.reduce<Record<string, string>>((map, option) => {
        map[option.clave] = option.nombre;
        return map;
      }, {}),
    [roleOptions],
  );

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-lg font-semibold">Usuarios</h1>
        <Link to="/usuarios/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo usuario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="users-role-filter">
            Rol
          </label>
          <select
            id="users-role-filter"
            className="border rounded px-3 py-2 w-full"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleFilter);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            {roleOptions.map((option) => (
              <option key={option.id} value={option.clave}>
                {option.nombre}
              </option>
            ))}
          </select>
          {rolesQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar los roles.</p>
          )}
        </div>
      </div>

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
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-2">{user.username}</td>
                  <td>{roleNameByKey[user.role] ?? formatRoleLabel(user.role)}</td>
                  <td>
                    {user.persona
                      ? `${user.persona.apellidos} ${user.persona.nombres}`.trim()
                      : user.name ?? '-'}
                  </td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/usuarios/${user.id}/editar`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {deleteMutation.isError && (
            <p className="text-sm text-red-600 mt-2">No se pudo eliminar el usuario.</p>
          )}

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
