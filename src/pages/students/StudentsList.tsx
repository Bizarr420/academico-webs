import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import api from '@/app/services/api';

type Student = {
  id: number;
  ci: string | null;
  nombres: string;
  apellidos: string;
  curso: string | null;
};

type StudentsResponse = {
  items: Student[];
};

const PAGE_SIZE = 10;

export default function StudentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage((current) => (current === 1 ? current : 1));
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery<StudentsResponse>({
    queryKey: ['students', page, debouncedSearch],
    queryFn: async () => {
      const response = await api.get<StudentsResponse>('/students', {
        params: {
          page,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const students = data?.items ?? [];
  const isEmpty = !isLoading && students.length === 0;
  const isFirstPage = page === 1;
  const disableNext = students.length < PAGE_SIZE;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Estudiantes</h1>
        <Link to="/estudiantes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="mb-3">
        <input
          placeholder="Buscar por nombre o CI…"
          className="border rounded px-3 py-2 w-full"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron estudiantes.</p>}

      {students.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">CI</th>
                <th>Nombre</th>
                <th>Curso</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="py-2">{student.ci || '-'}</td>
                  <td>
                    {student.apellidos} {student.nombres}
                  </td>
                  <td>{student.curso || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-2 justify-end mt-4">
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={isFirstPage || isFetching}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setPage((current) => current + 1)}
              disabled={disableNext || isFetching}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
