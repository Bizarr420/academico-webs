import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createCourse, getCourse, updateCourse } from '@/app/services/courses';
import type { CoursePayload } from '@/app/types';

const courseSchema = z.object({
  nombre: z.string().min(2, 'Ingresa el nombre del curso'),
  paralelo: z.string().min(1, 'Ingresa el paralelo'),
  nivel: z.string().optional(),
});

type CourseFormState = z.infer<typeof courseSchema>;

type FieldErrors = Partial<Record<keyof CourseFormState, string>>;

const initialValues: CourseFormState = {
  nombre: '',
  paralelo: '',
  nivel: '',
};

export default function CourseForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const [form, setForm] = useState<CourseFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => (courseId ? getCourse(Number(courseId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (courseQuery.data) {
      setForm({
        nombre: courseQuery.data.nombre,
        paralelo: courseQuery.data.paralelo,
        nivel: courseQuery.data.nivel ?? '',
      });
    }
  }, [courseQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: CoursePayload) =>
      courseId ? updateCourse(Number(courseId), payload) : createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      }
      navigate('/cursos');
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

    const nivelValue = (form.nivel ?? '').trim();
    const result = courseSchema.safeParse({
      nombre: form.nombre.trim(),
      paralelo: form.paralelo.trim(),
      nivel: nivelValue ? nivelValue : undefined,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof CourseFormState] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: keyof CourseFormState) => (value: string) => {
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

  if (isEditing && courseQuery.isLoading) {
    return <p>Cargando curso…</p>;
  }

  if (isEditing && courseQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del curso.</p>;
  }

  const title = isEditing ? 'Editar curso' : 'Nuevo curso';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-nombre">
            Nombre del curso
          </label>
          <input
            id="course-nombre"
            className="w-full border rounded px-3 py-2"
            value={form.nombre}
            onChange={(event) => updateField('nombre')(event.target.value)}
          />
          {fieldErrors.nombre && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombre}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-paralelo">
            Paralelo
          </label>
          <input
            id="course-paralelo"
            className="w-full border rounded px-3 py-2"
            value={form.paralelo}
            onChange={(event) => updateField('paralelo')(event.target.value)}
          />
          {fieldErrors.paralelo && <p className="text-sm text-red-600 mt-1">{fieldErrors.paralelo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-nivel">
            Nivel (opcional)
          </label>
          <input
            id="course-nivel"
            className="w-full border rounded px-3 py-2"
            value={form.nivel ?? ''}
            onChange={(event) => updateField('nivel')(event.target.value)}
          />
          {fieldErrors.nivel && <p className="text-sm text-red-600 mt-1">{fieldErrors.nivel}</p>}
        </div>
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
