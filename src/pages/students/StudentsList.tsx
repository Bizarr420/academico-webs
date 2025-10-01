import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deleteStudent, getStudents, STUDENTS_PAGE_SIZE } from '@/app/services/students';
import type { Student } from '@/app/types';
import StudentSummary from '@/pages/students/components/StudentSummary';

const SEARCH_DEBOUNCE_MS = 300;

export default function StudentsList() {
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
    queryKey: ['students', page, debouncedSearch],
    queryFn: async () =>
      getStudents({
        page,
        search: debouncedSearch || undefined,
        codigo_rude: debouncedSearch || undefined,
        page_size: STUDENTS_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const students: Student[] = data?.items ?? [];
  const pageSize = data?.page_size ?? STUDENTS_PAGE_SIZE;
  const isEmpty = !isLoading && !isError && students.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = students.length < pageSize || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar este estudiante?');
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Estudiantes</h1>
        <Link to="/estudiantes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nuevo
        </Link>
      </div>

      <div className="mb-3">
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

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar los estudiantes.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron estudiantes.</p>}

      {students.length > 0 && (
        <>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="space-y-3">
                <StudentSummary student={student} />
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/estudiantes/${student.id}/editar`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => handleDelete(student.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {deleteMutation.isError && (
            <p className="text-sm text-red-600 mt-2">No se pudo eliminar el estudiante.</p>
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
