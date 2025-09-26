import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createTeacher, getTeacher, updateTeacher } from '@/app/services/teachers';
import { getAllSubjects } from '@/app/services/subjects';
import type { Subject, TeacherPayload } from '@/app/types';

const teacherSchema = z.object({
  ci: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20, 'Máximo 20 caracteres'),
  nombres: z.string().min(2, 'Ingresa los nombres'),
  apellidos: z.string().min(2, 'Ingresa los apellidos'),
  especialidad: z.string().min(2, 'Ingresa la especialidad'),
  materia_ids: z.array(z.number()).min(1, 'Selecciona al menos una materia'),
});

type TeacherFormState = z.infer<typeof teacherSchema>;

type FieldErrors = Partial<Record<keyof TeacherFormState, string>>;

type TextField = 'ci' | 'nombres' | 'apellidos' | 'especialidad';

const initialValues: TeacherFormState = {
  ci: '',
  nombres: '',
  apellidos: '',
  especialidad: '',
  materia_ids: [],
};

export default function TeacherForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teacherId } = useParams();
  const isEditing = Boolean(teacherId);
  const [form, setForm] = useState<TeacherFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: async () => getAllSubjects(),
  });

  const teacherQuery = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => (teacherId ? getTeacher(Number(teacherId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (teacherQuery.data) {
      setForm({
        ci: teacherQuery.data.ci ?? '',
        nombres: teacherQuery.data.nombres,
        apellidos: teacherQuery.data.apellidos,
        especialidad: teacherQuery.data.especialidad ?? '',
        materia_ids: teacherQuery.data.materias?.map((subject) => subject.id) ?? [],
      });
    }
  }, [teacherQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: TeacherPayload) =>
      teacherId ? updateTeacher(Number(teacherId), payload) : createTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      if (teacherId) {
        queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] });
      }
      navigate('/docentes');
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

    const result = teacherSchema.safeParse({
      ci: form.ci.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      especialidad: form.especialidad.trim(),
      materia_ids: form.materia_ids,
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

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: TextField) => (value: string) => {
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

  const toggleSubject = (subjectId: number) => {
    setFieldErrors((previous) => {
      if (!previous.materia_ids) {
        return previous;
      }
      const next = { ...previous };
      delete next.materia_ids;
      return next;
    });
    setForm((previous) => {
      const exists = previous.materia_ids.includes(subjectId);
      const materia_ids = exists
        ? previous.materia_ids.filter((id) => id !== subjectId)
        : [...previous.materia_ids, subjectId];
      return { ...previous, materia_ids };
    });
  };

  const sortedSubjects = useMemo<Subject[]>(() => {
    if (!subjectsQuery.data) {
      return [];
    }
    return [...subjectsQuery.data].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [subjectsQuery.data]);

  if (isEditing && teacherQuery.isLoading) {
    return <p>Cargando docente…</p>;
  }

  if (isEditing && teacherQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del docente.</p>;
  }

  const title = isEditing ? 'Editar docente' : 'Nuevo docente';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-ci">
            CI
          </label>
          <input
            id="teacher-ci"
            className="w-full border rounded px-3 py-2"
            value={form.ci}
            onChange={(event) => updateField('ci')(event.target.value)}
          />
          {fieldErrors.ci && <p className="text-sm text-red-600 mt-1">{fieldErrors.ci}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-nombres">
              Nombres
            </label>
            <input
              id="teacher-nombres"
              className="w-full border rounded px-3 py-2"
              value={form.nombres}
              onChange={(event) => updateField('nombres')(event.target.value)}
            />
            {fieldErrors.nombres && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombres}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-apellidos">
              Apellidos
            </label>
            <input
              id="teacher-apellidos"
              className="w-full border rounded px-3 py-2"
              value={form.apellidos}
              onChange={(event) => updateField('apellidos')(event.target.value)}
            />
            {fieldErrors.apellidos && <p className="text-sm text-red-600 mt-1">{fieldErrors.apellidos}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-especialidad">
            Especialidad
          </label>
          <input
            id="teacher-especialidad"
            className="w-full border rounded px-3 py-2"
            value={form.especialidad}
            onChange={(event) => updateField('especialidad')(event.target.value)}
          />
          {fieldErrors.especialidad && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.especialidad}</p>
          )}
        </div>
        <div>
          <p className="block text-sm font-medium text-gray-600 mb-2">Materias asignadas</p>
          {subjectsQuery.isLoading && <p className="text-sm text-gray-500">Cargando materias…</p>}
          {subjectsQuery.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las materias.</p>
          )}
          {!subjectsQuery.isLoading && !subjectsQuery.isError && sortedSubjects.length === 0 && (
            <p className="text-sm text-gray-500">No hay materias registradas.</p>
          )}
          {!subjectsQuery.isLoading && !subjectsQuery.isError && sortedSubjects.length > 0 && (
            <div className="grid gap-2 max-h-56 overflow-y-auto border rounded px-3 py-2">
              {sortedSubjects.map((subject) => {
                const label = subject.curso
                  ? `${subject.nombre} · ${subject.curso}${subject.paralelo ? ` (${subject.paralelo})` : ''}`
                  : subject.nombre;
                const isChecked = form.materia_ids.includes(subject.id);
                return (
                  <label key={subject.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isChecked}
                      onChange={() => toggleSubject(subject.id)}
                      disabled={mutation.isPending}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          )}
          {fieldErrors.materia_ids && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.materia_ids}</p>
          )}
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
