import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getAllCourses } from '@/app/services/courses';
import { deleteSubject, getSubjects, SUBJECTS_PAGE_SIZE } from '@/app/services/subjects';
import type { Course, Subject } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function SubjectsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const coursesQuery = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => getAllCourses(),
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['subjects', page, debouncedSearch, selectedCourse],
    queryFn: async () =>
      getSubjects({
        page,
        search: debouncedSearch || undefined,
        page_size: SUBJECTS_PAGE_SIZE,
        curso_id: selectedCourse ? Number(selectedCourse) : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const subjects: Subject[] = data?.items ?? [];
  const pageSize = data?.page_size ?? SUBJECTS_PAGE_SIZE;
  const isEmpty = !isLoading && subjects.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = subjects.length < pageSize || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar esta materia?');
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Materias</h1>
        <Link to="/materias/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">
          Nueva
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 mb-3">
        <div>
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
        <div>
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
                {course.nombre} - {course.paralelo}
              </option>
            ))}
          </select>
          {coursesQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar los cursos.</p>
          )}
        </div>
      </div>

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
                <th>Curso</th>
                <th>Paralelo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="border-b last:border-0">
                  <td className="py-2">{subject.nombre}</td>
                  <td>{subject.curso || '-'}</td>
                  <td>{subject.paralelo || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/materias/${subject.id}/editar`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => handleDelete(subject.id)}
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
            <p className="text-sm text-red-600 mt-2">No se pudo eliminar la materia.</p>
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
