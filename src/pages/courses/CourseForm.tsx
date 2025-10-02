import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createCourse, getCourse, updateCourse } from '@/app/services/courses';
import { getAllLevels } from '@/app/services/levels';
import type { CoursePayload, Level } from '@/app/types';

const courseSchema = z.object({
  nombre: z.string().min(2, 'Ingresa el nombre del curso'),
  etiqueta: z.string().min(1, 'Ingresa la etiqueta del curso'),
  nivel_id: z.number().int().positive('Selecciona un nivel'),
  grado: z.number().int('Ingresa un grado válido').min(0, 'Ingresa un grado válido').optional(),
});

type CourseFormState = {
  nombre: string;
  etiqueta: string;
  nivelId: string;
  grado: string;
};

type FieldErrors = Partial<Record<'nombre' | 'etiqueta' | 'nivel_id' | 'grado', string>>;

const initialValues: CourseFormState = {
  nombre: '',
  etiqueta: '',
  nivelId: '',
  grado: '',
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

  const levelsQuery = useQuery({
    queryKey: ['levels', 'all'],
    queryFn: async () => getAllLevels(),
  });

  useEffect(() => {
    if (courseQuery.data) {
      setForm({
        nombre: courseQuery.data.nombre,
        etiqueta: courseQuery.data.etiqueta ?? '',
        nivelId: courseQuery.data.nivel_id != null ? courseQuery.data.nivel_id.toString() : '',
        grado:
          courseQuery.data.grado !== undefined && courseQuery.data.grado !== null
            ? courseQuery.data.grado.toString()
            : '',
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

    const nivelIdNumber = Number(form.nivelId);
    if (!form.nivelId || Number.isNaN(nivelIdNumber) || nivelIdNumber <= 0) {
      setFieldErrors((previous) => ({ ...previous, nivel_id: 'Selecciona un nivel' }));
      return;
    }

    const trimmedGrado = form.grado.trim();
    let gradoValue: number | undefined;
    if (trimmedGrado) {
      const parsedGrado = Number(trimmedGrado);
      if (!Number.isInteger(parsedGrado) || parsedGrado < 0) {
        setFieldErrors((previous) => ({ ...previous, grado: 'Ingresa un grado válido' }));
        return;
      }
      gradoValue = parsedGrado;
    }

    const result = courseSchema.safeParse({
      nombre: form.nombre.trim(),
      etiqueta: form.etiqueta.trim(),
      nivel_id: nivelIdNumber,
      grado: gradoValue,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          const targetField =
            field === 'nivel_id' || field === 'nombre' || field === 'etiqueta' || field === 'grado'
              ? field
              : null;
          if (targetField && !newErrors[targetField as keyof FieldErrors]) {
            newErrors[targetField as keyof FieldErrors] = issue.message;
          }
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
      const targetField = field === 'nivelId' ? 'nivel_id' : field;
      if (!previous[targetField as keyof FieldErrors]) {
        return previous;
      }
      const next = { ...previous };
      delete next[targetField as keyof FieldErrors];
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
  const levels = levelsQuery.data ?? [];

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
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-etiqueta">
            Etiqueta
          </label>
          <input
            id="course-etiqueta"
            className="w-full border rounded px-3 py-2"
            value={form.etiqueta}
            onChange={(event) => updateField('etiqueta')(event.target.value)}
          />
          {fieldErrors.etiqueta && <p className="text-sm text-red-600 mt-1">{fieldErrors.etiqueta}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-nivel">
            Nivel
          </label>
          <select
            id="course-nivel"
            className="w-full border rounded px-3 py-2"
            value={form.nivelId}
            onChange={(event) => updateField('nivelId')(event.target.value)}
            disabled={levelsQuery.isLoading}
          >
            <option value="">Selecciona un nivel</option>
            {levels.map((level: Level) => {
              const label = level.etiqueta ? `${level.nombre} (${level.etiqueta})` : level.nombre;
              return (
                <option key={level.id} value={level.id}>
                  {label}
                </option>
              );
            })}
          </select>
          {levelsQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar los niveles.</p>
          )}
          {levelsQuery.isSuccess && levels.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Registra un nivel antes de crear cursos.</p>
          )}
          {fieldErrors.nivel_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.nivel_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="course-grado">
            Grado (opcional)
          </label>
          <input
            id="course-grado"
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.grado}
            onChange={(event) => updateField('grado')(event.target.value)}
            min={0}
          />
          {fieldErrors.grado && <p className="text-sm text-red-600 mt-1">{fieldErrors.grado}</p>}
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
