import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deletePerson, getPeople, PEOPLE_PAGE_SIZE } from '@/app/services/people';
import type { Person } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function PeopleList() {
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
    queryKey: ['people', page, debouncedSearch],
    queryFn: async () =>
      getPeople({
        page,
        search: debouncedSearch || undefined,
        page_size: PEOPLE_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const people: Person[] = data?.items ?? [];
  const pageSize = data?.page_size ?? PEOPLE_PAGE_SIZE;
  const isEmpty = !isLoading && !isError && people.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = people.length < pageSize || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar esta persona?');
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const formatFullName = (person: Person) => `${person.apellidos} ${person.nombres}`.trim();

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Personas</h1>
        <Link to="/personas/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nueva persona
        </Link>
      </div>

      <div className="mb-3">
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
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id} className="border-b last:border-0">
                  <td className="py-2">{person.ci || '-'}</td>
                  <td>{formatFullName(person)}</td>
                  <td>{person.telefono || '-'}</td>
                  <td>{person.correo || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/personas/${person.id}/editar`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => handleDelete(person.id)}
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
            <p className="text-sm text-red-600 mt-2">No se pudo eliminar la persona.</p>
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
