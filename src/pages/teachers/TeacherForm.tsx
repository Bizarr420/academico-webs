import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { createTeacher } from '@/app/services/teachers';
import type { TeacherPayload } from '@/app/types';

const teacherSchema = z.object({
  ci: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20, 'Máximo 20 caracteres'),
  nombres: z.string().min(2, 'Ingresa los nombres'),
  apellidos: z.string().min(2, 'Ingresa los apellidos'),
  especialidad: z.string().min(2, 'Ingresa la especialidad'),
});

type TeacherFormState = z.infer<typeof teacherSchema>;

type FieldErrors = Partial<Record<keyof TeacherFormState, string>>;

const initialValues: TeacherFormState = {
  ci: '',
  nombres: '',
  apellidos: '',
  especialidad: '',
};

export default function TeacherForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TeacherFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: TeacherPayload) => createTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
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

  const updateField = (field: keyof TeacherFormState) => (value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">Nuevo docente</h1>
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
