import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { createStudent, getStudent, updateStudent } from '@/app/services/students';
import {
  SEX_CODES,
  SEX_LABELS,
  STUDENT_SITUATION_LABELS,
  STUDENT_SITUATIONS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATES,
} from '@/app/types';
import type {
  Paginated,
  PersonPayload,
  Student,
  StudentPayload,
  StudentSituation,
  StudentStatus,
  Sexo,
} from '@/app/types';
import StudentSummary from '@/pages/students/components/StudentSummary';

type PersonMode = 'existing' | 'new';

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

type StudentFormState = {
  personMode: PersonMode;
  persona_id: string;
  codigo_est: string;
  anio_ingreso: string;
  situacion: '' | StudentSituation;
  estado: '' | StudentStatus;
  persona: PersonFormState;
};

type PersonFieldErrors = Partial<Record<keyof PersonFormState, string>>;

type FieldErrors = {
  persona_id?: string;
  codigo_est?: string;
  anio_ingreso?: string;
  situacion?: string;
  estado?: string;
  persona?: PersonFieldErrors;
};

const codigoEstSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el código del estudiante.')
  .max(50, 'Máximo 50 caracteres.');

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

const studentSchema = z.discriminatedUnion('personMode', [
  z.object({
    personMode: z.literal('existing'),
    persona_id: z.coerce
      .number()
      .refine((value) => Number.isFinite(value), {
        message: 'Ingresa un ID de persona válido.',
      })
      .int('El ID de la persona debe ser un número entero.')
      .positive('El ID de la persona debe ser mayor a 0.'),
    codigo_est: codigoEstSchema,
  }),
  z.object({
    personMode: z.literal('new'),
    codigo_est: codigoEstSchema,
    persona: personSchema,
  }),
]);

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

const createInitialFormState = (): StudentFormState => ({
  personMode: 'existing',
  persona_id: '',
  codigo_est: '',
  anio_ingreso: String(new Date().getFullYear()),
  situacion: '',
  estado: '',
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
  const [form, setForm] = useState<StudentFormState>(() => createInitialFormState());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => (studentId ? getStudent(Number(studentId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (studentQuery.data) {
      const persona = studentQuery.data.persona;
      const fechaNacimiento = persona?.fecha_nacimiento ?? '';
      setForm({
        personMode: 'existing',
        persona_id: String(studentQuery.data.persona_id ?? ''),
        codigo_est: studentQuery.data.codigo_est ?? '',
        anio_ingreso: studentQuery.data.anio_ingreso
          ? String(studentQuery.data.anio_ingreso)
          : '',
        situacion: studentQuery.data.situacion ?? '',
        estado: studentQuery.data.estado ?? '',
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
    } else if (!isEditing) {
      setForm(createInitialFormState());
    }
  }, [isEditing, studentQuery.data]);

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

        if (error.response.status === 404 && normalizedDetail.includes('persona')) {
          setFieldErrors((previous) => ({ ...previous, persona_id: 'La persona indicada no existe.' }));
          setSubmitError('');
          return;
        }

        if (error.response.status === 400) {
          if (normalizedDetail.includes('codigo_est') && (normalizedDetail.includes('existe') || normalizedDetail.includes('registrad'))) {
            setFieldErrors((previous) => ({ ...previous, codigo_est: 'El código de estudiante ya está registrado.' }));
            setSubmitError('');
            return;
          }

          if (normalizedDetail.includes('persona') && normalizedDetail.includes('registrad')) {
            if (form.personMode === 'existing') {
              setFieldErrors((previous) => ({
                ...previous,
                persona_id: 'La persona indicada ya está registrada como estudiante.',
              }));
              setSubmitError('');
            } else {
              setSubmitError('La persona ingresada ya está registrada como estudiante.');
            }
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

        setSubmitError(detail || 'No se pudo guardar.');
        return;
      }

      setSubmitError('No se pudo guardar.');
    },
  });

  const clearTopLevelError = (field: Exclude<keyof FieldErrors, 'persona'>) => {
    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

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

    const trimmedCodigo = form.codigo_est.trim();
    const trimmedAnioIngreso = form.anio_ingreso.trim();
    const selectedSituacion = form.situacion;
    const selectedEstado = form.estado;
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

    const payloadInput =
      form.personMode === 'existing'
        ? {
            personMode: 'existing' as const,
            persona_id: form.persona_id.trim(),
            codigo_est: trimmedCodigo,
          }
        : {
            personMode: 'new' as const,
            codigo_est: trimmedCodigo,
          persona: personaInput,
        };

    const result = studentSchema.safeParse(payloadInput);

    const optionalFieldErrors: FieldErrors = {};

    if (trimmedAnioIngreso) {
      if (!/^[0-9]{4}$/u.test(trimmedAnioIngreso)) {
        optionalFieldErrors.anio_ingreso = 'Ingresa un año válido (YYYY).';
      }
    }

    if (selectedSituacion && !STUDENT_SITUATIONS.includes(selectedSituacion)) {
      optionalFieldErrors.situacion = 'Selecciona una situación válida.';
    }

    if (selectedEstado && !STUDENT_STATES.includes(selectedEstado)) {
      optionalFieldErrors.estado = 'Selecciona un estado válido.';
    }

    if (!result.success) {
      const newErrors: FieldErrors = { ...optionalFieldErrors };
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

    if (Object.keys(optionalFieldErrors).length > 0) {
      setFieldErrors(optionalFieldErrors);
      return;
    }

    let payload: StudentPayload;

    if (result.data.personMode === 'existing') {
      payload = {
        persona_id: result.data.persona_id,
        codigo_est: result.data.codigo_est,
      };
    } else {
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

      payload = {
        codigo_est: result.data.codigo_est,
        persona: personaPayload,
      };
    }

    if (trimmedAnioIngreso) {
      payload.anio_ingreso = Number(trimmedAnioIngreso);
    }

    if (selectedSituacion) {
      payload.situacion = selectedSituacion;
    }

    if (selectedEstado) {
      payload.estado = selectedEstado;
    }

    setFieldErrors({});
    mutation.mutate(payload);
  };

  const updateTopLevelField = (field: 'persona_id' | 'codigo_est' | 'anio_ingreso') => (value: string) => {
    setSubmitError('');
    clearTopLevelError(field);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateSelectField = (field: 'situacion' | 'estado') => (value: string) => {
    setSubmitError('');
    clearTopLevelError(field);

    if (field === 'situacion') {
      const normalizedValue: StudentFormState['situacion'] =
        value === '' || STUDENT_SITUATIONS.includes(value as StudentSituation)
          ? (value as StudentFormState['situacion'])
          : '';
      setForm((previous) => ({
        ...previous,
        situacion: normalizedValue,
      }));
      return;
    }

    const normalizedEstado: StudentFormState['estado'] =
      value === '' || STUDENT_STATES.includes(value as StudentStatus)
        ? (value as StudentFormState['estado'])
        : '';
    setForm((previous) => ({
      ...previous,
      estado: normalizedEstado,
    }));
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

  const handlePersonModeChange = (mode: PersonMode) => {
    setSubmitError('');
    setFieldErrors((previous) => {
      if (mode === 'existing') {
        if (!previous.persona) {
          return previous;
        }
        const next = { ...previous };
        delete next.persona;
        return next;
      }

      if (!previous.persona_id) {
        return previous;
      }

      const next = { ...previous };
      delete next.persona_id;
      return next;
    });

    setForm((previous) => ({
      ...previous,
      personMode: mode,
      persona_id: mode === 'existing' ? previous.persona_id : '',
      persona:
        mode === 'new' && previous.personMode === 'existing'
          ? createEmptyPerson()
          : previous.persona,
    }));
  };

  if (isEditing && studentQuery.isLoading) {
    return <p>Cargando estudiante…</p>;
  }

  if (isEditing && studentQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del estudiante.</p>;
  }

  const title = isEditing ? 'Editar estudiante' : 'Nuevo estudiante';

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      {isEditing && studentQuery.data && (
        <div className="mb-4">
          <StudentSummary student={studentQuery.data} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="block text-sm font-medium text-gray-600">Persona asociada</span>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="student-person-mode"
                value="existing"
                checked={form.personMode === 'existing'}
                onChange={() => handlePersonModeChange('existing')}
              />
              Vincular persona existente
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="student-person-mode"
                value="new"
                checked={form.personMode === 'new'}
                onChange={() => handlePersonModeChange('new')}
              />
              Registrar nueva persona
            </label>
          </div>
        </div>

        {form.personMode === 'existing' && (
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-persona-id">
              ID de la persona
            </label>
            <input
              id="student-persona-id"
              className="w-full border rounded px-3 py-2"
              value={form.persona_id}
              onChange={(event) => updateTopLevelField('persona_id')(event.target.value)}
              inputMode="numeric"
            />
            {fieldErrors.persona_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.persona_id}</p>}
          </div>
        )}

        {form.personMode === 'new' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-nombres">
                  Nombres
                </label>
                <input
                  id="student-person-nombres"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.nombres}
                  onChange={(event) => updatePersonaField('nombres')(event.target.value)}
                />
                {fieldErrors.persona?.nombres && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.nombres}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-apellidos">
                  Apellidos
                </label>
                <input
                  id="student-person-apellidos"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.apellidos}
                  onChange={(event) => updatePersonaField('apellidos')(event.target.value)}
                />
                {fieldErrors.persona?.apellidos && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.apellidos}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-sexo">
                  Sexo
                </label>
                <select
                  id="student-person-sexo"
                  className="w-full border rounded px-3 py-2"
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
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.sexo}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-fecha-nacimiento">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  id="student-person-fecha-nacimiento"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.fecha_nacimiento}
                  onChange={(event) => updatePersonaField('fecha_nacimiento')(event.target.value)}
                />
                {fieldErrors.persona?.fecha_nacimiento && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.fecha_nacimiento}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-celular">
                  Celular
                </label>
                <input
                  id="student-person-celular"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.celular}
                  onChange={(event) => updatePersonaField('celular')(event.target.value)}
                />
                {fieldErrors.persona?.celular && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.celular}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-direccion">
                  Dirección
                </label>
                <input
                  id="student-person-direccion"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.direccion}
                  onChange={(event) => updatePersonaField('direccion')(event.target.value)}
                />
                {fieldErrors.persona?.direccion && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.direccion}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-numero">
                  N° de CI (opcional)
                </label>
                <input
                  id="student-person-ci-numero"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.ci_numero}
                  onChange={(event) => updatePersonaField('ci_numero')(event.target.value)}
                />
                {fieldErrors.persona?.ci_numero && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.ci_numero}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-complemento">
                  Complemento
                </label>
                <input
                  id="student-person-ci-complemento"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.ci_complemento}
                  onChange={(event) => updatePersonaField('ci_complemento')(event.target.value)}
                />
                {fieldErrors.persona?.ci_complemento && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.ci_complemento}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-expedicion">
                  Expedición
                </label>
                <input
                  id="student-person-ci-expedicion"
                  className="w-full border rounded px-3 py-2"
                  value={form.persona.ci_expedicion}
                  onChange={(event) => updatePersonaField('ci_expedicion')(event.target.value)}
                />
                {fieldErrors.persona?.ci_expedicion && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.persona.ci_expedicion}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-codigo">
              Código de estudiante
            </label>
            <input
              id="student-codigo"
              className="w-full border rounded px-3 py-2"
              value={form.codigo_est}
              onChange={(event) => updateTopLevelField('codigo_est')(event.target.value)}
              maxLength={50}
            />
            {fieldErrors.codigo_est && <p className="text-sm text-red-600 mt-1">{fieldErrors.codigo_est}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-anio-ingreso">
              Año de ingreso
            </label>
            <input
              id="student-anio-ingreso"
              className="w-full border rounded px-3 py-2"
              value={form.anio_ingreso}
              onChange={(event) => updateTopLevelField('anio_ingreso')(event.target.value)}
              placeholder="YYYY"
              inputMode="numeric"
            />
            {fieldErrors.anio_ingreso && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.anio_ingreso}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-situacion">
              Situación académica
            </label>
            <select
              id="student-situacion"
              className="w-full border rounded px-3 py-2"
              value={form.situacion}
              onChange={(event) => updateSelectField('situacion')(event.target.value)}
            >
              <option value="">Por defecto (API)</option>
              {STUDENT_SITUATIONS.map((option) => (
                <option key={option} value={option}>
                  {STUDENT_SITUATION_LABELS[option]}
                </option>
              ))}
            </select>
            {fieldErrors.situacion && <p className="text-sm text-red-600 mt-1">{fieldErrors.situacion}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-estado">
              Estado académico
            </label>
            <select
              id="student-estado"
              className="w-full border rounded px-3 py-2"
              value={form.estado}
              onChange={(event) => updateSelectField('estado')(event.target.value)}
            >
              <option value="">Por defecto (API)</option>
              {STUDENT_STATES.map((option) => (
                <option key={option} value={option}>
              {STUDENT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
            {fieldErrors.estado && <p className="text-sm text-red-600 mt-1">{fieldErrors.estado}</p>}
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
