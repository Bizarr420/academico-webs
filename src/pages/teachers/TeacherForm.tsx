import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { createTeacher, getTeacher, restoreTeacher, updateTeacher } from '@/app/services/teachers';
import { SEX_CODES, SEX_LABELS } from '@/app/types';
import type { Paginated, PersonPayload, Sexo, Teacher, TeacherPayload } from '@/app/types';
import { extractInactiveResourceId } from '@/app/utils/api-errors';
import { resolveStatus } from '@/app/utils/status';

const textFieldSchema = z
  .string()
  .trim()
  .max(120, 'Máximo 120 caracteres')
  .optional();

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

type TeacherFormState = {
  titulo: string;
  profesion: string;
  persona: PersonFormState;
};

type PersonFieldErrors = Partial<Record<keyof PersonFormState, string>>;

type FieldErrors = {
  titulo?: string;
  profesion?: string;
  persona?: PersonFieldErrors;
};

const personSchema = z.object({
  nombres: z.string().min(1, 'Ingresa los nombres').max(120, 'Máximo 120 caracteres'),
  apellidos: z.string().min(1, 'Ingresa los apellidos').max(120, 'Máximo 120 caracteres'),
  sexo: z.enum(SEX_CODES, { message: 'Selecciona un sexo válido' }),
  fecha_nacimiento: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'Ingresa una fecha válida (YYYY-MM-DD)'),
  celular: z
    .string()
    .min(1, 'Ingresa el celular')
    .max(20, 'Máximo 20 caracteres'),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  ci_numero: z.string().max(20, 'Máximo 20 caracteres').optional(),
  ci_complemento: z.string().max(5, 'Máximo 5 caracteres').optional(),
  ci_expedicion: z.string().max(5, 'Máximo 5 caracteres').optional(),
});

const teacherSchema = z.object({
  persona: personSchema,
  titulo: textFieldSchema,
  profesion: textFieldSchema,
});

const createEmptyPerson = (): PersonFormState => ({
  nombres: '',
  apellidos: '',
  sexo: '',
  fecha_nacimiento: '',
  celular: '',
  direccion: '',
  ci_numero: '',
  ci_complemento: '',
  ci_expedicion: '',
});

const createInitialFormState = (): TeacherFormState => ({
  titulo: '',
  profesion: '',
  persona: createEmptyPerson(),
});

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
  const [form, setForm] = useState<TeacherFormState>(() => createInitialFormState());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [restoreSuggestion, setRestoreSuggestion] = useState<{ id: number | null; message: string } | null>(null);
  const [originalTeacher, setOriginalTeacher] = useState<Teacher | null>(null);

  const teacherQuery = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => (teacherId ? getTeacher(Number(teacherId)) : null),
    enabled: isEditing,
  });

  const syncFormWithTeacher = (teacher: Teacher) => {
    const persona = teacher.persona;
    const fechaNacimiento = persona?.fecha_nacimiento ?? '';
    setForm({
      titulo: teacher.titulo ?? '',
      profesion: teacher.profesion ?? '',
      persona: {
        nombres: persona?.nombres ?? '',
        apellidos: persona?.apellidos ?? '',
        sexo: persona?.sexo ?? '',
        fecha_nacimiento: fechaNacimiento ? fechaNacimiento.slice(0, 10) : '',
        celular: persona?.celular ?? '',
        direccion: persona?.direccion ?? '',
        ci_numero: persona?.ci_numero ?? '',
        ci_complemento: persona?.ci_complemento ?? '',
        ci_expedicion: persona?.ci_expedicion ?? '',
      },
    });
    setOriginalTeacher(teacher);
  };

  useEffect(() => {
    if (teacherQuery.data) {
      syncFormWithTeacher(teacherQuery.data);
    } else if (!isEditing) {
      setForm(createInitialFormState());
      setOriginalTeacher(null);
    }
  }, [isEditing, teacherQuery.data]);

  const currentTeacher = teacherQuery.data ?? originalTeacher;
  const teacherStatus = currentTeacher
    ? resolveStatus({ estado: currentTeacher.estado ?? undefined, activo: currentTeacher.activo })
    : null;
  const isInactive = teacherStatus?.isActive === false;

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => restoreTeacher(id),
    onSuccess: (teacher) => {
      updateTeacherCollections(queryClient, teacher);
      queryClient.setQueryData(['teacher', teacher.id], teacher);
      setRestoreSuggestion(null);

      if (teacherId && Number(teacherId) === teacher.id) {
        queryClient.setQueryData(['teacher', teacherId], teacher);
        syncFormWithTeacher(teacher);
        setInfoMessage('Registro restaurado y activo.');
        setSubmitError('');
        return;
      }

      setInfoMessage('Registro restaurado y activo.');
      setSubmitError('');
      navigate(`/docentes/${teacher.id}/editar`);
    },
    onError: () => {
      setSubmitError('No se pudo restaurar el registro.');
      setInfoMessage('');
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: TeacherPayload | Partial<TeacherPayload>) =>
      teacherId ? updateTeacher(Number(teacherId), payload) : createTeacher(payload as TeacherPayload),
    onSuccess: (teacher) => {
      updateTeacherCollections(queryClient, teacher);
      if (teacherId) {
        queryClient.setQueryData(['teacher', teacherId], teacher);
      }
      queryClient.setQueryData(['teacher', String(teacher.id)], teacher);
      setOriginalTeacher(teacher);
      setInfoMessage('');
      setRestoreSuggestion(null);
      navigate('/docentes');
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

        const detail = extractErrorDetail(error.response.data);
        const normalizedDetail = detail.toLowerCase();

        if (error.response.status === 400) {
          if (normalizedDetail.includes('docente') && normalizedDetail.includes('registrad')) {
            setSubmitError('Ya existe un docente asignado a esta persona.');
            return;
          }

          if (normalizedDetail.includes('persona') && normalizedDetail.includes('registrad')) {
            setSubmitError('La persona ingresada ya está registrada como docente.');
            return;
          }

          if (normalizedDetail.includes('ci ya registrado')) {
            setSubmitError('El número de CI ingresado ya está registrado.');
            return;
          }

          if (detail) {
            setSubmitError(detail);
            return;
          }
        }

        setRestoreSuggestion(null);
        setSubmitError(detail || 'No se pudo guardar.');
        return;
      }

      setRestoreSuggestion(null);
      setSubmitError('No se pudo guardar.');
    },
  });

  const clearPersonaError = (field: keyof PersonFormState) => {
    setFieldErrors((previous) => {
      if (!previous.persona || !previous.persona[field]) {
        return previous;
      }
      const nextPersona = { ...previous.persona };
      delete nextPersona[field];
      const next: FieldErrors = { ...previous };
      if (Object.keys(nextPersona).length > 0) {
        next.persona = nextPersona;
      } else {
        delete next.persona;
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setInfoMessage('');
    setRestoreSuggestion(null);

    if (isEditing && isInactive) {
      setSubmitError('Este registro está inactivo. Restaura el registro para poder editarlo.');
      return;
    }

    const personaInput = {
      nombres: form.persona.nombres.trim(),
      apellidos: form.persona.apellidos.trim(),
      sexo: form.persona.sexo,
      fecha_nacimiento: form.persona.fecha_nacimiento,
      celular: form.persona.celular.trim(),
      direccion: form.persona.direccion.trim() || undefined,
      ci_numero: form.persona.ci_numero.trim() || undefined,
      ci_complemento: form.persona.ci_complemento.trim() || undefined,
      ci_expedicion: form.persona.ci_expedicion.trim() || undefined,
    };

    const payloadInput = {
      persona: personaInput,
      titulo: form.titulo,
      profesion: form.profesion,
    };

    const result = teacherSchema.safeParse(payloadInput);

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const [first, second] = issue.path;
        if (first === 'persona' && typeof second === 'string') {
          const personaErrors = { ...(newErrors.persona ?? {}) };
          if (!personaErrors[second as keyof PersonFormState]) {
            personaErrors[second as keyof PersonFormState] = issue.message;
          }
          newErrors.persona = personaErrors;
          continue;
        }

        if (typeof first === 'string' && !(first in newErrors)) {
          (newErrors as Record<string, string>)[first] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    const tituloValue = result.data.titulo?.trim?.() ?? '';
    const profesionValue = result.data.profesion?.trim?.() ?? '';

    const personaPayload: PersonPayload = {
      nombres: result.data.persona.nombres,
      apellidos: result.data.persona.apellidos,
      sexo: result.data.persona.sexo,
      fecha_nacimiento: result.data.persona.fecha_nacimiento,
      celular: result.data.persona.celular,
    };

    if (result.data.persona.direccion) {
      personaPayload.direccion = result.data.persona.direccion;
    }

    if (result.data.persona.ci_numero) {
      personaPayload.ci_numero = result.data.persona.ci_numero;
    }

    if (result.data.persona.ci_complemento) {
      personaPayload.ci_complemento = result.data.persona.ci_complemento;
    }

    if (result.data.persona.ci_expedicion) {
      personaPayload.ci_expedicion = result.data.persona.ci_expedicion;
    }

    const payload: TeacherPayload = {
      persona: personaPayload,
    };

    if (tituloValue.length > 0) {
      payload.titulo = tituloValue;
    } else if (isEditing && originalTeacher && (originalTeacher.titulo ?? '') !== '') {
      payload.titulo = null;
    }

    if (profesionValue.length > 0) {
      payload.profesion = profesionValue;
    } else if (isEditing && originalTeacher && (originalTeacher.profesion ?? '') !== '') {
      payload.profesion = null;
    }

    let payloadToSend: TeacherPayload | Partial<TeacherPayload> = payload;

    if (isEditing && originalTeacher) {
      const filtered: Partial<TeacherPayload> = { ...payload };

      if ('titulo' in filtered && (filtered.titulo ?? null) === (originalTeacher.titulo ?? null)) {
        delete filtered.titulo;
      }

      if ('profesion' in filtered && (filtered.profesion ?? null) === (originalTeacher.profesion ?? null)) {
        delete filtered.profesion;
      }

      const originalPersona = originalTeacher.persona;
      if ('persona' in filtered && filtered.persona) {
        const personaToCompare = filtered.persona;
        const hasPersonaChanges =
          !originalPersona ||
          personaToCompare.nombres !== (originalPersona.nombres ?? '') ||
          personaToCompare.apellidos !== (originalPersona.apellidos ?? '') ||
          personaToCompare.sexo !== (originalPersona.sexo ?? '') ||
          personaToCompare.fecha_nacimiento !== (originalPersona.fecha_nacimiento ?? '') ||
          personaToCompare.celular !== (originalPersona.celular ?? '') ||
          (personaToCompare.direccion ?? '') !== (originalPersona.direccion ?? '') ||
          (personaToCompare.ci_numero ?? '') !== (originalPersona.ci_numero ?? '') ||
          (personaToCompare.ci_complemento ?? '') !== (originalPersona.ci_complemento ?? '') ||
          (personaToCompare.ci_expedicion ?? '') !== (originalPersona.ci_expedicion ?? '');

        if (!hasPersonaChanges) {
          delete filtered.persona;
        }
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

  const updateTopLevelField = (field: 'titulo' | 'profesion') => (value: string) => {
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

  const updatePersonaField = (field: keyof PersonFormState) => (value: string) => {
    setSubmitError('');
    clearPersonaError(field);
    setForm((previous) => ({
      ...previous,
      persona: {
        ...previous.persona,
        [field]: value,
      },
    }));
  };

  const handleRestoreClick = () => {
    if (!teacherId) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(Number(teacherId));
  };

  const handleRestoreSuggestion = () => {
    if (!restoreSuggestion || !restoreSuggestion.id) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(restoreSuggestion.id);
  };

  if (isEditing && teacherQuery.isLoading) {
    return <p>Cargando docente…</p>;
  }

  if (isEditing && teacherQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del docente.</p>;
  }

  const title = isEditing ? 'Editar docente' : 'Nuevo docente';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      {isEditing && isInactive && (
        <div className="mb-4 flex flex-col gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Este registro está inactivo. ¿Deseas restaurarlo?</span>
          <button
            type="button"
            className="rounded bg-yellow-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={handleRestoreClick}
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
          <span className="block text-sm font-medium text-gray-600">Datos de la persona</span>
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-nombres">
                  Nombres
                </label>
                <input
                  id="teacher-person-nombres"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.nombres}
                  onChange={(event) => updatePersonaField('nombres')(event.target.value)}
                />
                {fieldErrors.persona?.nombres && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.nombres}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-apellidos">
                  Apellidos
                </label>
                <input
                  id="teacher-person-apellidos"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.apellidos}
                  onChange={(event) => updatePersonaField('apellidos')(event.target.value)}
                />
                {fieldErrors.persona?.apellidos && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.apellidos}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-sexo">
                  Sexo
                </label>
                <select
                  id="teacher-person-sexo"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.sexo}
                  onChange={(event) => updatePersonaField('sexo')(event.target.value as PersonFormState['sexo'])}
                >
                  <option value="">Selecciona…</option>
                  {SEX_CODES.map((option) => (
                    <option key={option} value={option}>
                      {SEX_LABELS[option]}
                    </option>
                  ))}
                </select>
                {fieldErrors.persona?.sexo && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.sexo}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-fecha-nacimiento">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  id="teacher-person-fecha-nacimiento"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.fecha_nacimiento}
                  onChange={(event) => updatePersonaField('fecha_nacimiento')(event.target.value)}
                />
                {fieldErrors.persona?.fecha_nacimiento && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.fecha_nacimiento}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-celular">
                  Celular
                </label>
                <input
                  id="teacher-person-celular"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.celular}
                  onChange={(event) => updatePersonaField('celular')(event.target.value)}
                />
                {fieldErrors.persona?.celular && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.celular}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-direccion">
                  Dirección
                </label>
                <input
                  id="teacher-person-direccion"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.direccion}
                  onChange={(event) => updatePersonaField('direccion')(event.target.value)}
                />
                {fieldErrors.persona?.direccion && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.direccion}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-ci-numero">
                  N° de CI (opcional)
                </label>
                <input
                  id="teacher-person-ci-numero"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.ci_numero}
                  onChange={(event) => updatePersonaField('ci_numero')(event.target.value)}
                />
                {fieldErrors.persona?.ci_numero && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.ci_numero}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-ci-complemento">
                  Complemento
                </label>
                <input
                  id="teacher-person-ci-complemento"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.ci_complemento}
                  onChange={(event) => updatePersonaField('ci_complemento')(event.target.value)}
                />
                {fieldErrors.persona?.ci_complemento && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.ci_complemento}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-person-ci-expedicion">
                  Expedición
                </label>
                <input
                  id="teacher-person-ci-expedicion"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.ci_expedicion}
                  onChange={(event) => updatePersonaField('ci_expedicion')(event.target.value)}
                />
                {fieldErrors.persona?.ci_expedicion && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.ci_expedicion}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="teacher-titulo">
            Título profesional
          </label>
          <input
            id="teacher-titulo"
            className="w-full border rounded px-3 py-2"
            value={form.titulo}
            onChange={(event) => updateTopLevelField('titulo')(event.target.value)}
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
            onChange={(event) => updateTopLevelField('profesion')(event.target.value)}
            maxLength={120}
          />
          {fieldErrors.profesion && <p className="text-sm text-red-600 mt-1">{fieldErrors.profesion}</p>}
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
