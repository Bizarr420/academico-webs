import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { getAllCourses } from '@/app/services/courses';
import { createSubject, getSubject, updateSubject } from '@/app/services/subjects';
import type { Course, SubjectPayload } from '@/app/types';

const subjectSchema = z.object({
  nombre: z.string().min(2, 'Ingresa el nombre de la materia'),
  codigo: z.string().min(2, 'Ingresa el código de la materia'),
  curso_id: z.number().int().positive('Selecciona un curso'),
});

const formatCourseLabel = (course: Course) => {
  const paralelos = course.paralelos ?? [];
  const paralelosLabel = paralelos
    .map((parallel) => parallel.nombre || parallel.etiqueta || '')
    .filter((label) => label.trim().length > 0);
  const paraleloDisplay = paralelosLabel.length > 0 ? paralelosLabel.join(', ') : course.etiqueta ?? '';
  const parts = [course.nombre, paraleloDisplay].filter((part) => part && part.trim().length > 0);
  const baseLabel = parts.length > 0 ? parts.join(' - ') : course.nombre;
  return course.nivel ? `${baseLabel} • ${course.nivel}` : baseLabel;
};

type SubjectFormState = {
  nombre: string;
  codigo: string;
  curso_id: string;
};

type FieldErrors = Partial<Record<'nombre' | 'codigo' | 'curso_id', string>>;

const initialValues: SubjectFormState = {
  nombre: '',
  codigo: '',
  curso_id: '',
};

export default function SubjectForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subjectId } = useParams();
  const isEditing = Boolean(subjectId);
  const [form, setForm] = useState<SubjectFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const coursesQuery = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => getAllCourses(),
  });

  const subjectQuery = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: async () => (subjectId ? getSubject(Number(subjectId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (subjectQuery.data) {
      setForm({
        nombre: subjectQuery.data.nombre,
        codigo: subjectQuery.data.codigo ?? '',
        curso_id: subjectQuery.data.curso_id.toString(),
      });
    }
  }, [subjectQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: SubjectPayload) =>
      subjectId ? updateSubject(Number(subjectId), payload) : createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ['subject', subjectId] });
      }
      navigate('/materias');
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? // @ts-expect-error Axios style error shape
            error.response?.data?.detail ?? 'No se pudo guardar'
          : 'No se pudo guardar';
      setSubmitError(typeof message === 'string' ? message : 'No se pudo guardar');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const parsedCourseId = Number(form.curso_id);
    if (!form.curso_id || Number.isNaN(parsedCourseId)) {
      setFieldErrors({ curso_id: 'Selecciona un curso' });
      return;
    }

    const result = subjectSchema.safeParse({
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      curso_id: parsedCourseId,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof SubjectFormState] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: keyof SubjectFormState) => (value: string) => {
    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  if (isEditing && subjectQuery.isLoading) {
    return <p>Cargando materia…</p>;
  }

  if (isEditing && subjectQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información de la materia.</p>;
  }

  const title = isEditing ? 'Editar materia' : 'Nueva materia';
  const courses = coursesQuery.data ?? [];

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="subject-nombre">
            Nombre de la materia
          </label>
          <input
            id="subject-nombre"
            className="w-full border rounded px-3 py-2"
            value={form.nombre}
            onChange={(event) => updateField('nombre')(event.target.value)}
          />
          {fieldErrors.nombre && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombre}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="subject-codigo">
            Código
          </label>
          <input
            id="subject-codigo"
            className="w-full border rounded px-3 py-2"
            value={form.codigo}
            onChange={(event) => updateField('codigo')(event.target.value)}
          />
          {fieldErrors.codigo && <p className="text-sm text-red-600 mt-1">{fieldErrors.codigo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="subject-curso">
            Curso
          </label>
          <select
            id="subject-curso"
            className="w-full border rounded px-3 py-2"
            value={form.curso_id}
            onChange={(event) => updateField('curso_id')(event.target.value)}
          >
            <option value="">Selecciona un curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {formatCourseLabel(course)}
              </option>
            ))}
          </select>
          {coursesQuery.isLoading && <p className="text-sm text-gray-500 mt-1">Cargando cursos…</p>}
          {coursesQuery.isError && <p className="text-sm text-red-600 mt-1">No se pudieron cargar los cursos.</p>}
          {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Registra un curso antes de crear materias.</p>
          )}
          {fieldErrors.curso_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.curso_id}</p>}
        </div>
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
