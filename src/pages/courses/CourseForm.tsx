import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createCourse, getCourse, updateCourse } from '@/app/services/courses';
import { createCourseParallel } from '@/app/services/parallels';
import { getAllLevels } from '@/app/services/levels';
import type { CoursePayload, Level } from '@/app/types';

const courseSchema = z.object({
  nombre: z.string().min(2, 'Ingresa el nombre del curso'),
  nivel_id: z.number().int().positive('Selecciona un nivel'),
});

type CourseFormState = {
  nombre: string;
  nivelId: string;
  paraleloNombre: string;
};

type FieldErrors = {
  nombre?: string;
  nivel_id?: string;
  paraleloNombre?: string;
};

const initialValues: CourseFormState = {
  nombre: '',
  nivelId: '',
  paraleloNombre: '',
};

type CourseFormProps = {
  onCancel?: () => void;
  onCreated?: () => void;
};

export default function CourseForm({ onCancel, onCreated }: CourseFormProps) {
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
      setForm((prev) => ({
        ...prev,
        nombre: courseQuery.data ? courseQuery.data.nombre : '',
        nivelId: courseQuery.data && courseQuery.data.nivel_id != null ? courseQuery.data.nivel_id.toString() : '',
      }));
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const nivelIdNumber = Number(form.nivelId);
    if (!form.nivelId || Number.isNaN(nivelIdNumber) || nivelIdNumber <= 0) {
      setFieldErrors((previous) => ({ ...previous, nivel_id: 'Selecciona un nivel' }));
      return;
    }
    if (!form.paraleloNombre.trim()) {
      setFieldErrors((previous) => ({ ...previous, paraleloNombre: 'Ingresa el nombre del paralelo' }));
      return;
    }
    const result = courseSchema.safeParse({
      nombre: form.nombre.trim(),
      nivel_id: nivelIdNumber,
    });

    // Construir el payload completo para CoursePayload
    const payload: CoursePayload = {
      nombre: form.nombre.trim(),
      nivel_id: nivelIdNumber,
    };

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === 'nombre' || field === 'nivel_id') {
          newErrors[field] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    // Crear curso y paralelo obligatoriamente
    try {
      const createdCourse = await mutation.mutateAsync(payload);
      if (!courseId && createdCourse && createdCourse.id) {
        await createCourseParallel(createdCourse.id, form.paraleloNombre.trim());
        if (onCreated) onCreated();
      }
    } catch (error) {
      // El manejo de error ya está en mutation.onError
    }
  };

  const updateField = (field: keyof CourseFormState) => (value: string) => {
    setFieldErrors((previous) => {
      const targetField = field === 'nivelId' ? 'nivel_id' : field;
      if (!previous[targetField]) {
        return previous;
      }
      const next = { ...previous };
      delete next[targetField];
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
            {levels
              .filter((level: Level) => level.nombre.toLowerCase().includes('secundaria'))
              .map((level: Level) => (
                <option key={level.id} value={level.id}>
                  {level.nombre}
                </option>
              ))}
          </select>
          {levelsQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar los niveles.</p>
          )}
          {levelsQuery.isSuccess && levels.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Registra un nivel antes de crear cursos.</p>
          )}
          {fieldErrors.nivel_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.nivel_id}</p>}
        </div>
        {/* Paralelo obligatorio */}
        {!isEditing && (
          <div className="border rounded p-3 bg-gray-50 mt-2">
            <label className="block text-sm font-medium text-gray-600" htmlFor="paralelo-nombre">
              Nombre del paralelo
            </label>
            <input
              id="paralelo-nombre"
              className="w-full border rounded px-3 py-2"
              value={form.paraleloNombre}
              onChange={(event) => updateField('paraleloNombre')(event.target.value)}
            />
            {fieldErrors.paraleloNombre && <p className="text-sm text-red-600 mt-1">{fieldErrors.paraleloNombre}</p>}
          </div>
        )}
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <div className="flex gap-2 justify-end mt-6 bg-gray-50 p-4 rounded-b-xl border-t">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
