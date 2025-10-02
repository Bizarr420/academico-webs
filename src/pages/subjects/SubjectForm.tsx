import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { getAllCourses } from '@/app/services/courses';
import { createSubject, getSubject, restoreSubject, updateSubject } from '@/app/services/subjects';
import type { Course, SubjectPayload } from '@/app/types';
import { extractInactiveResourceId } from '@/app/utils/api-errors';
import { resolveStatus } from '@/app/utils/status';

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
  const [infoMessage, setInfoMessage] = useState('');
  const [restoreSuggestion, setRestoreSuggestion] = useState<{ id: number | null; message: string } | null>(null);

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

  const currentSubject = subjectQuery.data;
  const subjectStatus = currentSubject
    ? resolveStatus({ estado: currentSubject.estado ?? undefined, activo: currentSubject.activo })
    : null;
  const isInactive = subjectStatus?.isActive === false;

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => restoreSubject(id),
    onSuccess: (subject) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (subjectId) {
        queryClient.setQueryData(['subject', subjectId], subject);
        setForm({
          nombre: subject.nombre,
          codigo: subject.codigo ?? '',
          curso_id: subject.curso_id ? String(subject.curso_id) : '',
        });
        setInfoMessage('Registro restaurado y activo.');
        setSubmitError('');
        setRestoreSuggestion(null);
      } else {
        navigate(`/materias/${subject.id}/editar`);
      }
    },
    onError: () => {
      setSubmitError('No se pudo restaurar el registro.');
      setInfoMessage('');
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: SubjectPayload) =>
      subjectId ? updateSubject(Number(subjectId), payload) : createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ['subject', subjectId] });
      }
      setInfoMessage('');
      setRestoreSuggestion(null);
      navigate('/materias');
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          const suggestedId = extractInactiveResourceId(error.response.data);
          setRestoreSuggestion({
            id: suggestedId,
            message: 'Existe un registro inactivo con ese código. ¿Deseas restaurarlo?',
          });
          setSubmitError('Existe un registro inactivo con ese código. ¿Deseas restaurarlo?');
          setInfoMessage('');
          return;
        }

        const detail = error.response.data?.detail;
        const message = typeof detail === 'string' ? detail : 'No se pudo guardar';
        setSubmitError(message);
        setInfoMessage('');
        return;
      }

      setSubmitError('No se pudo guardar');
      setInfoMessage('');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setInfoMessage('');
    setRestoreSuggestion(null);

    if (isEditing && isInactive) {
      setSubmitError('Este registro está inactivo. Restaura el registro para poder editarlo.');
      return;
    }

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

  const handleRestoreCurrent = () => {
    if (!subjectId) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(Number(subjectId));
  };

  const handleRestoreSuggestion = () => {
    if (!restoreSuggestion || !restoreSuggestion.id) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(restoreSuggestion.id);
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
      {isEditing && isInactive && (
        <div className="mb-4 flex flex-col gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Este registro está inactivo. ¿Deseas restaurarlo?</span>
          <button
            type="button"
            className="rounded bg-yellow-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={handleRestoreCurrent}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? 'Restaurando…' : 'Restaurar'}
          </button>
        </div>
      )}
      {restoreSuggestion && (
        <div className="mb-4 flex flex-col gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{restoreSuggestion.message}</span>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={handleRestoreSuggestion}
            disabled={!restoreSuggestion.id || restoreMutation.isPending}
            title={restoreSuggestion.id ? undefined : 'ID de registro no disponible'}
          >
            {restoreMutation.isPending ? 'Restaurando…' : 'Restaurar registro existente'}
          </button>
        </div>
      )}
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
        {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            disabled={mutation.isPending || (isEditing && isInactive)}
            title={isEditing && isInactive ? 'Restaura el registro para habilitar la edición.' : undefined}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
