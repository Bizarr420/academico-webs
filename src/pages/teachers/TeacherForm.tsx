import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { createTeacher, getTeacher, updateTeacher } from '@/app/services/teachers';
import type { Paginated, Teacher, TeacherPayload } from '@/app/types';

const textFieldSchema = z
  .string()
  .trim()
  .max(120, 'Máximo 120 caracteres')
  .optional();

const teacherSchema = z.object({
  persona_id: z.coerce
    .number({ invalid_type_error: 'Ingresa un ID de persona válido.' })
    .int('El ID de la persona debe ser un número entero.')
    .positive('El ID de la persona debe ser mayor a 0.'),
  titulo: textFieldSchema,
  profesion: textFieldSchema,
});

type TeacherFormState = {
  persona_id: string;
  titulo: string;
  profesion: string;
};

type FieldErrors = Partial<Record<keyof TeacherFormState, string>>;

const initialValues: TeacherFormState = {
  persona_id: '',
  titulo: '',
  profesion: '',
};

const extractErrorDetail = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if ('detail' in value && value.detail) {
      const detail = value.detail as unknown;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map((item) => String(item)).join(', ');
      }
      if (typeof detail === 'object' && detail) {
        return Object.values(detail as Record<string, unknown>)
          .map((item) => String(item))
          .join(', ');
      }
    }

    if ('message' in value && typeof value.message === 'string') {
      return value.message;
    }
  }

  return '';
};

const updateTeacherCollections = (
  queryClient: ReturnType<typeof useQueryClient>,
  teacher: Teacher,
) => {
  queryClient.setQueriesData<Paginated<Teacher>>({ queryKey: ['teachers'] }, (previous) => {
    if (!previous) {
      return previous;
    }

    const items = previous.items ?? [];
    const index = items.findIndex((item) => item.id === teacher.id);
    let nextItems: Teacher[];

    if (index >= 0) {
      nextItems = [...items];
      nextItems[index] = teacher;
    } else {
      nextItems = [teacher, ...items];
      if (nextItems.length > previous.page_size) {
        nextItems = nextItems.slice(0, previous.page_size);
      }
    }

    return {
      ...previous,
      items: nextItems,
    };
  });
};

export default function TeacherForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teacherId } = useParams();
  const isEditing = Boolean(teacherId);
  const [form, setForm] = useState<TeacherFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [originalTeacher, setOriginalTeacher] = useState<Teacher | null>(null);

  const teacherQuery = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => (teacherId ? getTeacher(Number(teacherId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (teacherQuery.data) {
      setForm({
        persona_id: String(teacherQuery.data.persona_id ?? ''),
        titulo: teacherQuery.data.titulo ?? '',
        profesion: teacherQuery.data.profesion ?? '',
      });
      setOriginalTeacher(teacherQuery.data);
    }
  }, [teacherQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: TeacherPayload | Partial<TeacherPayload>) =>
      teacherId ? updateTeacher(Number(teacherId), payload) : createTeacher(payload as TeacherPayload),
    onSuccess: (teacher) => {
      updateTeacherCollections(queryClient, teacher);
      if (teacherId) {
        queryClient.setQueryData(['teacher', teacherId], teacher);
      }
      queryClient.setQueryData(['teacher', String(teacher.id)], teacher);
      navigate('/docentes');
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response) {
        const detail = extractErrorDetail(error.response.data);
        const normalizedDetail = detail.toLowerCase();

        if (error.response.status === 404 && normalizedDetail.includes('persona no encontrada')) {
          setFieldErrors((previous) => ({ ...previous, persona_id: 'La persona indicada no existe.' }));
          setSubmitError('');
          return;
        }

        if (error.response.status === 400 && normalizedDetail.includes('docente ya existe')) {
          setFieldErrors((previous) => ({ ...previous, persona_id: 'Ya existe un docente asignado a esta persona.' }));
          setSubmitError('');
          return;
        }

        setSubmitError(detail || 'No se pudo guardar.');
        return;
      }

      setSubmitError('No se pudo guardar.');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const result = teacherSchema.safeParse({
      persona_id: form.persona_id,
      titulo: form.titulo,
      profesion: form.profesion,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof TeacherFormState] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    const trimmedTitulo = result.data.titulo ? result.data.titulo.trim() : '';
    const trimmedProfesion = result.data.profesion ? result.data.profesion.trim() : '';

    const basePayload: TeacherPayload = {
      persona_id: result.data.persona_id,
    };

    if (trimmedTitulo.length > 0) {
      basePayload.titulo = trimmedTitulo;
    } else if (isEditing && originalTeacher && (originalTeacher.titulo ?? '') !== '') {
      basePayload.titulo = null;
    }

    if (trimmedProfesion.length > 0) {
      basePayload.profesion = trimmedProfesion;
    } else if (isEditing && originalTeacher && (originalTeacher.profesion ?? '') !== '') {
      basePayload.profesion = null;
    }

    let payloadToSend: TeacherPayload | Partial<TeacherPayload> = basePayload;

    if (isEditing && originalTeacher) {
      const filtered: Partial<TeacherPayload> = { ...basePayload };

      if (filtered.persona_id === originalTeacher.persona_id) {
        delete filtered.persona_id;
      }

      if ((filtered.titulo ?? null) === (originalTeacher.titulo ?? null)) {
        delete filtered.titulo;
      }

      if ((filtered.profesion ?? null) === (originalTeacher.profesion ?? null)) {
        delete filtered.profesion;
      }

      if (Object.keys(filtered).length === 0) {
        setSubmitError('No se detectaron cambios para actualizar.');
        return;
      }

      payloadToSend = filtered;
    }

    setFieldErrors({});
    mutation.mutate(payloadToSend);
  };

  const updateField = (field: keyof TeacherFormState) => (value: string) => {
    setSubmitError('');
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

  if (isEditing && teacherQuery.isLoading) {
    return <p>Cargando docente…</p>;
  }

  if (isEditing && teacherQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del docente.</p>;
  }

  const title = isEditing ? 'Editar docente' : 'Nuevo docente';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-persona-id">
            ID de la persona
          </label>
          <input
            id="teacher-persona-id"
            className="w-full border rounded px-3 py-2"
            value={form.persona_id}
            onChange={(event) => updateField('persona_id')(event.target.value)}
            inputMode="numeric"
          />
          {fieldErrors.persona_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.persona_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-titulo">
            Título profesional
          </label>
          <input
            id="teacher-titulo"
            className="w-full border rounded px-3 py-2"
            value={form.titulo}
            onChange={(event) => updateField('titulo')(event.target.value)}
            maxLength={120}
          />
          {fieldErrors.titulo && <p className="text-sm text-red-600 mt-1">{fieldErrors.titulo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-profesion">
            Profesión
          </label>
          <input
            id="teacher-profesion"
            className="w-full border rounded px-3 py-2"
            value={form.profesion}
            onChange={(event) => updateField('profesion')(event.target.value)}
            maxLength={120}
          />
          {fieldErrors.profesion && <p className="text-sm text-red-600 mt-1">{fieldErrors.profesion}</p>}
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
