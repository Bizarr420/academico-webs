import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createStudent, getStudent, updateStudent } from '@/app/services/students';
import type { StudentPayload } from '@/app/types';

const studentSchema = z.object({
  ci: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20, 'Máximo 20 caracteres'),
  nombres: z.string().min(2, 'Ingresa los nombres'),
  apellidos: z.string().min(2, 'Ingresa los apellidos'),
  curso: z.string().min(1, 'Ingresa el curso/paralelo'),
});

type StudentFormState = z.infer<typeof studentSchema>;

type FieldErrors = Partial<Record<keyof StudentFormState, string>>;

const initialValues: StudentFormState = {
  ci: '',
  nombres: '',
  apellidos: '',
  curso: '',
};

export default function StudentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { studentId } = useParams();
  const isEditing = Boolean(studentId);
  const [form, setForm] = useState<StudentFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => (studentId ? getStudent(Number(studentId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (studentQuery.data) {
      setForm({
        ci: studentQuery.data.ci ?? '',
        nombres: studentQuery.data.nombres,
        apellidos: studentQuery.data.apellidos,
        curso: studentQuery.data.curso ?? '',
      });
    }
  }, [studentQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: StudentPayload) =>
      studentId ? updateStudent(Number(studentId), payload) : createStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      }
      navigate('/estudiantes');
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

    const result = studentSchema.safeParse({
      ci: form.ci.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      curso: form.curso.trim(),
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof StudentFormState] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: keyof StudentFormState) => (value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  if (isEditing && studentQuery.isLoading) {
    return <p>Cargando estudiante…</p>;
  }

  if (isEditing && studentQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del estudiante.</p>;
  }

  const title = isEditing ? 'Editar estudiante' : 'Nuevo estudiante';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="student-ci">
            CI
          </label>
          <input
            id="student-ci"
            className="w-full border rounded px-3 py-2"
            value={form.ci}
            onChange={(event) => updateField('ci')(event.target.value)}
          />
          {fieldErrors.ci && <p className="text-sm text-red-600 mt-1">{fieldErrors.ci}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-nombres">
              Nombres
            </label>
            <input
              id="student-nombres"
              className="w-full border rounded px-3 py-2"
              value={form.nombres}
              onChange={(event) => updateField('nombres')(event.target.value)}
            />
            {fieldErrors.nombres && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombres}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-apellidos">
              Apellidos
            </label>
            <input
              id="student-apellidos"
              className="w-full border rounded px-3 py-2"
              value={form.apellidos}
              onChange={(event) => updateField('apellidos')(event.target.value)}
            />
            {fieldErrors.apellidos && <p className="text-sm text-red-600 mt-1">{fieldErrors.apellidos}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="student-curso">
            Curso/Paralelo
          </label>
          <input
            id="student-curso"
            className="w-full border rounded px-3 py-2"
            value={form.curso}
            onChange={(event) => updateField('curso')(event.target.value)}
          />
          {fieldErrors.curso && <p className="text-sm text-red-600 mt-1">{fieldErrors.curso}</p>}
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
