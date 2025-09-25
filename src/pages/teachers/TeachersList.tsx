import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getTeachers, TEACHERS_PAGE_SIZE } from '@/app/services/teachers';
import type { Teacher } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function TeachersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['teachers', page, debouncedSearch],
    queryFn: async () =>
      getTeachers({
        page,
        search: debouncedSearch || undefined,
        page_size: TEACHERS_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const teachers: Teacher[] = data?.items ?? [];
  const pageSize = data?.page_size ?? TEACHERS_PAGE_SIZE;
  const isEmpty = !isLoading && teachers.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = teachers.length < pageSize || isFetching;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Docentes</h1>
        <Link to="/docentes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="teachers-search">
          Buscar
        </label>
        <input
          id="teachers-search"
          placeholder="Buscar por nombre o CI…"
          className="border rounded px-3 py-2 w-full"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar los docentes.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron docentes.</p>}

      {teachers.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">CI</th>
                <th>Nombre</th>
                <th>Especialidad</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b last:border-0">
                  <td className="py-2">{teacher.ci || '-'}</td>
                  <td>
                    {teacher.apellidos} {teacher.nombres}
                  </td>
                  <td>{teacher.especialidad || '-'}</td>
                </tr>
              ))}
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
