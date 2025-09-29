import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deleteRole, getRoles, ROLES_PAGE_SIZE } from '@/app/services/roles';
import type { RoleDefinition } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function RolesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
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
    queryKey: ['roles', page, debouncedSearch],
    queryFn: async () =>
      getRoles({
        page,
        search: debouncedSearch || undefined,
        page_size: ROLES_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const roles: RoleDefinition[] = useMemo(() => data?.items ?? [], [data?.items]);
  const pageSize = data?.page_size ?? ROLES_PAGE_SIZE;
  const isEmpty = !isLoading && !isError && roles.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = roles.length < pageSize || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar este rol?');
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Roles</h1>
        <Link to="/roles/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="roles-search">
          Buscar
        </label>
        <input
          id="roles-search"
          placeholder="Buscar por nombre de rol…"
          className="border rounded px-3 py-2 w-full"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar los roles.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron roles.</p>}

      {roles.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nombre</th>
                <th>Descripción</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const views = role.vistas ?? [];
                const viewsLabel =
                  views.length > 0 ? views.map((view) => view.nombre).join(', ') : '-';
                return (
                  <tr key={role.id} className="border-b last:border-0">
                    <td className="py-2">{role.nombre}</td>
                    <td className="max-w-sm truncate" title={role.descripcion ?? undefined}>
                      {role.descripcion || '-'}
                    </td>
                    <td className="max-w-sm truncate" title={viewsLabel}>
                      {views.length > 0 ? `${views.length} vistas` : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          to={`/roles/${role.id}/editar`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => handleDelete(role.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {deleteMutation.isError && (
            <p className="text-sm text-red-600 mt-2">No se pudo eliminar el rol.</p>
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
