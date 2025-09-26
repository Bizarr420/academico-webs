import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createPerson, getPerson, updatePerson } from '@/app/services/people';
import type { PersonPayload } from '@/app/types';

const personSchema = z.object({
  ci: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20, 'Máximo 20 caracteres'),
  nombres: z.string().min(2, 'Ingresa los nombres'),
  apellidos: z.string().min(2, 'Ingresa los apellidos'),
  direccion: z.string().min(3, 'Ingresa la dirección').optional(),
  telefono: z.string().min(6, 'Ingresa un teléfono válido').max(20, 'Máximo 20 caracteres').optional(),
  correo: z.string().email('Ingresa un correo válido').optional(),
});

type PersonFormState = {
  ci: string;
  nombres: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  correo: string;
};

type FieldErrors = Partial<Record<keyof PersonFormState, string>>;

const initialValues: PersonFormState = {
  ci: '',
  nombres: '',
  apellidos: '',
  direccion: '',
  telefono: '',
  correo: '',
};

export default function PersonForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { personId } = useParams();
  const isEditing = Boolean(personId);
  const [form, setForm] = useState<PersonFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const personQuery = useQuery({
    queryKey: ['person', personId],
    queryFn: async () => (personId ? getPerson(Number(personId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (personQuery.data) {
      setForm({
        ci: personQuery.data.ci ?? '',
        nombres: personQuery.data.nombres,
        apellidos: personQuery.data.apellidos,
        direccion: personQuery.data.direccion ?? '',
        telefono: personQuery.data.telefono ?? '',
        correo: personQuery.data.correo ?? '',
      });
    }
  }, [personQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: PersonPayload) =>
      personId ? updatePerson(Number(personId), payload) : createPerson(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      if (personId) {
        queryClient.invalidateQueries({ queryKey: ['person', personId] });
      }
      navigate('/personas');
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

    const result = personSchema.safeParse({
      ci: form.ci.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      direccion: form.direccion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      correo: form.correo.trim() || undefined,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof PersonFormState] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: keyof PersonFormState) => (value: string) => {
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

  if (isEditing && personQuery.isLoading) {
    return <p>Cargando persona…</p>;
  }

  if (isEditing && personQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información de la persona.</p>;
  }

  const title = isEditing ? 'Editar persona' : 'Nueva persona';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-ci">
              CI
            </label>
            <input
              id="person-ci"
              className="w-full border rounded px-3 py-2"
              value={form.ci}
              onChange={(event) => updateField('ci')(event.target.value)}
            />
            {fieldErrors.ci && <p className="text-sm text-red-600 mt-1">{fieldErrors.ci}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-telefono">
              Teléfono
            </label>
            <input
              id="person-telefono"
              className="w-full border rounded px-3 py-2"
              value={form.telefono}
              onChange={(event) => updateField('telefono')(event.target.value)}
            />
            {fieldErrors.telefono && <p className="text-sm text-red-600 mt-1">{fieldErrors.telefono}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-nombres">
              Nombres
            </label>
            <input
              id="person-nombres"
              className="w-full border rounded px-3 py-2"
              value={form.nombres}
              onChange={(event) => updateField('nombres')(event.target.value)}
            />
            {fieldErrors.nombres && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombres}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-apellidos">
              Apellidos
            </label>
            <input
              id="person-apellidos"
              className="w-full border rounded px-3 py-2"
              value={form.apellidos}
              onChange={(event) => updateField('apellidos')(event.target.value)}
            />
            {fieldErrors.apellidos && <p className="text-sm text-red-600 mt-1">{fieldErrors.apellidos}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-correo">
              Correo electrónico
            </label>
            <input
              id="person-correo"
              className="w-full border rounded px-3 py-2"
              value={form.correo}
              onChange={(event) => updateField('correo')(event.target.value)}
            />
            {fieldErrors.correo && <p className="text-sm text-red-600 mt-1">{fieldErrors.correo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-direccion">
              Dirección
            </label>
            <input
              id="person-direccion"
              className="w-full border rounded px-3 py-2"
              value={form.direccion}
              onChange={(event) => updateField('direccion')(event.target.value)}
            />
            {fieldErrors.direccion && <p className="text-sm text-red-600 mt-1">{fieldErrors.direccion}</p>}
          </div>
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
