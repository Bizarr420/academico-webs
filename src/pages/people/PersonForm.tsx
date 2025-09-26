import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createPerson, getPerson, updatePerson } from '@/app/services/people';
import { SEX_CODES, SEX_LABELS } from '@/app/types';
import type { PersonPayload, Sexo } from '@/app/types';

const personSchema = z.object({
  nombres: z.string().min(1, 'Ingresa los nombres').max(120, 'Máximo 120 caracteres'),
  apellidos: z.string().min(1, 'Ingresa los apellidos').max(120, 'Máximo 120 caracteres'),
  sexo: z.enum(SEX_CODES, {
    errorMap: () => ({
      message: 'Selecciona un sexo válido',
    }),
  }),
  fecha_nacimiento: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'Ingresa una fecha válida (YYYY-MM-DD)'),
  celular: z.string().max(20, 'Máximo 20 caracteres').optional(),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  ci_numero: z.string().max(20, 'Máximo 20 caracteres').optional(),
  ci_complemento: z.string().max(5, 'Máximo 5 caracteres').optional(),
  ci_expedicion: z.string().max(5, 'Máximo 5 caracteres').optional(),
});

type PersonFormState = {
  nombres: string;
  apellidos: string;
  sexo: '' | Sexo;
  fecha_nacimiento: string;
  celular: string;
  direccion: string;
  ci_numero: string;
  ci_complemento: string;
  ci_expedicion: string;
};

type FieldErrors = Partial<Record<keyof PersonFormState, string>>;

const initialValues: PersonFormState = {
  nombres: '',
  apellidos: '',
  sexo: '',
  fecha_nacimiento: '',
  celular: '',
  direccion: '',
  ci_numero: '',
  ci_complemento: '',
  ci_expedicion: '',
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
      const fechaNacimiento = personQuery.data.fecha_nacimiento ?? '';
      setForm({
        nombres: personQuery.data.nombres,
        apellidos: personQuery.data.apellidos,
        sexo: personQuery.data.sexo ?? '',
        fecha_nacimiento: fechaNacimiento ? fechaNacimiento.slice(0, 10) : '',
        celular: personQuery.data.celular ?? '',
        direccion: personQuery.data.direccion ?? '',
        ci_numero: personQuery.data.ci_numero ?? '',
        ci_complemento: personQuery.data.ci_complemento ?? '',
        ci_expedicion: personQuery.data.ci_expedicion ?? '',
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

    const trimmed = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      sexo: form.sexo,
      fecha_nacimiento: form.fecha_nacimiento,
      celular: form.celular.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      ci_numero: form.ci_numero.trim() || undefined,
      ci_complemento: form.ci_complemento.trim() || undefined,
      ci_expedicion: form.ci_expedicion.trim() || undefined,
    };

    const result = personSchema.safeParse({
      ...trimmed,
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

  const updateField = <TField extends keyof PersonFormState>(field: TField) =>
    (value: PersonFormState[TField]) => {
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
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-sexo">
              Sexo
            </label>
            <select
              id="person-sexo"
              className="w-full border rounded px-3 py-2"
              value={form.sexo}
              onChange={(event) =>
                updateField('sexo')(event.target.value as PersonFormState['sexo'])
              }
            >
              <option value="">Selecciona…</option>
              {SEX_CODES.map((option) => (
                <option key={option} value={option}>
                  {SEX_LABELS[option]}
                </option>
              ))}
            </select>
            {fieldErrors.sexo && <p className="text-sm text-red-600 mt-1">{fieldErrors.sexo}</p>}
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-600"
              htmlFor="person-fecha-nacimiento"
            >
              Fecha de nacimiento
            </label>
            <input
              type="date"
              id="person-fecha-nacimiento"
              className="w-full border rounded px-3 py-2"
              value={form.fecha_nacimiento}
              onChange={(event) => updateField('fecha_nacimiento')(event.target.value)}
            />
            {fieldErrors.fecha_nacimiento && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.fecha_nacimiento}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-celular">
              Celular
            </label>
            <input
              id="person-celular"
              className="w-full border rounded px-3 py-2"
              value={form.celular}
              onChange={(event) => updateField('celular')(event.target.value)}
            />
            {fieldErrors.celular && <p className="text-sm text-red-600 mt-1">{fieldErrors.celular}</p>}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="person-ci-numero">
              Número de CI
            </label>
            <input
              id="person-ci-numero"
              className="w-full border rounded px-3 py-2"
              value={form.ci_numero}
              onChange={(event) => updateField('ci_numero')(event.target.value)}
            />
            {fieldErrors.ci_numero && <p className="text-sm text-red-600 mt-1">{fieldErrors.ci_numero}</p>}
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-600"
              htmlFor="person-ci-complemento"
            >
              Complemento
            </label>
            <input
              id="person-ci-complemento"
              className="w-full border rounded px-3 py-2"
              value={form.ci_complemento}
              onChange={(event) => updateField('ci_complemento')(event.target.value)}
            />
            {fieldErrors.ci_complemento && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.ci_complemento}</p>
            )}
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-600"
              htmlFor="person-ci-expedicion"
            >
              Expedición
            </label>
            <input
              id="person-ci-expedicion"
              className="w-full border rounded px-3 py-2"
              value={form.ci_expedicion}
              onChange={(event) => updateField('ci_expedicion')(event.target.value)}
            />
            {fieldErrors.ci_expedicion && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.ci_expedicion}</p>
            )}
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
