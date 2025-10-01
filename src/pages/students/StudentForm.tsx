import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { createStudent, getStudent, updateStudent } from '@/app/services/students';
import type { Paginated, Student, StudentPayload } from '@/app/types';

const studentSchema = z.object({
  persona_id: z.coerce
    .number({ invalid_type_error: 'Ingresa un ID de persona válido.' })
    .int('El ID de la persona debe ser un número entero.')
    .positive('El ID de la persona debe ser mayor a 0.'),
  codigo_est: z
    .string()
    .trim()
    .min(1, 'Ingresa el código del estudiante.')
    .max(50, 'Máximo 50 caracteres.'),
});

type StudentFormState = {
  persona_id: string;
  codigo_est: string;
};

type FieldErrors = Partial<Record<keyof StudentFormState, string>>;

const initialValues: StudentFormState = {
  persona_id: '',
  codigo_est: '',
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

const updateStudentCollections = (
  queryClient: ReturnType<typeof useQueryClient>,
  student: Student,
) => {
  queryClient.setQueriesData<Paginated<Student>>({ queryKey: ['students'] }, (previous) => {
    if (!previous) {
      return previous;
    }

    const items = previous.items ?? [];
    const index = items.findIndex((item) => item.id === student.id);
    let nextItems: Student[];

    if (index >= 0) {
      nextItems = [...items];
      nextItems[index] = student;
    } else {
      nextItems = [student, ...items];
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
        persona_id: String(studentQuery.data.persona_id ?? ''),
        codigo_est: studentQuery.data.codigo_est ?? '',
      });
    }
  }, [studentQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: StudentPayload) =>
      studentId ? updateStudent(Number(studentId), payload) : createStudent(payload),
    onSuccess: (student) => {
      updateStudentCollections(queryClient, student);
      if (studentId) {
        queryClient.setQueryData(['student', studentId], student);
      }
      queryClient.setQueryData(['student', String(student.id)], student);
      navigate('/estudiantes');
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

        if (error.response.status === 400 && normalizedDetail.includes('codigo_est ya existe')) {
          setFieldErrors((previous) => ({ ...previous, codigo_est: 'El código de estudiante ya existe.' }));
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

    const result = studentSchema.safeParse({
      persona_id: form.persona_id,
      codigo_est: form.codigo_est,
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

    const payload: StudentPayload = {
      persona_id: result.data.persona_id,
      codigo_est: result.data.codigo_est,
    };

    setFieldErrors({});
    mutation.mutate(payload);
  };

  const updateField = (field: keyof StudentFormState) => (value: string) => {
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
          <label className="block text-sm font-medium text-gray-600" htmlFor="student-persona-id">
            ID de la persona
          </label>
          <input
            id="student-persona-id"
            className="w-full border rounded px-3 py-2"
            value={form.persona_id}
            onChange={(event) => updateField('persona_id')(event.target.value)}
            inputMode="numeric"
          />
          {fieldErrors.persona_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.persona_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="student-codigo">
            Código de estudiante
          </label>
          <input
            id="student-codigo"
            className="w-full border rounded px-3 py-2"
            value={form.codigo_est}
            onChange={(event) => updateField('codigo_est')(event.target.value)}
            maxLength={50}
          />
          {fieldErrors.codigo_est && <p className="text-sm text-red-600 mt-1">{fieldErrors.codigo_est}</p>}
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
