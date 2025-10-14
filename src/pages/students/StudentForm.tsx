import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { isAxiosError } from 'axios';

import { createStudent, getStudent, restoreStudent, updateStudent } from '@/app/services/students';
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
import { extractInactiveResourceId } from '@/app/utils/api-errors';
import { resolveStatus } from '@/app/utils/status';

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
  codigo_rude: string;
  anio_ingreso: string;
  situacion: '' | StudentSituation;
  estado: '' | StudentStatus;
  persona: PersonFormState;
};

type PersonFieldErrors = Partial<Record<keyof PersonFormState, string>>;

type FieldErrors = {
  codigo_rude?: string;
  anio_ingreso?: string;
  situacion?: string;
  estado?: string;
  persona?: PersonFieldErrors;
};

const codigoRudeSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el código RUDE del estudiante.')
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

const studentSchema = z.object({
  codigo_rude: codigoRudeSchema,
  persona: personSchema,
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

const createInitialFormState = (): StudentFormState => ({
  codigo_rude: '',
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
  const [infoMessage, setInfoMessage] = useState('');
  const [restoreSuggestion, setRestoreSuggestion] = useState<{ id: number | null; message: string } | null>(null);
  const [loadedStudent, setLoadedStudent] = useState<Student | null>(null);

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => (studentId ? getStudent(Number(studentId)) : null),
    enabled: isEditing,
  });

  const syncFormWithStudent = (student: Student) => {
    const persona = student.persona;
    const fechaNacimiento = persona?.fecha_nacimiento ?? '';
    setForm({
      codigo_rude: student.codigo_rude ?? '',
      anio_ingreso: student.anio_ingreso ? String(student.anio_ingreso) : '',
      situacion: student.situacion ?? '',
      estado: student.estado ?? '',
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
    setLoadedStudent(student);
  };

  useEffect(() => {
    if (studentQuery.data) {
      syncFormWithStudent(studentQuery.data);
    } else if (!isEditing) {
      setForm(createInitialFormState());
      setLoadedStudent(null);
    }
  }, [isEditing, studentQuery.data]);

  const currentStudent = studentQuery.data ?? loadedStudent;
  const studentStatus = currentStudent
    ? resolveStatus({ estado: currentStudent.estado ?? undefined, activo: currentStudent.activo })
    : null;
  const isInactive = studentStatus?.isActive === false;

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => restoreStudent(id),
    onSuccess: (student) => {
      updateStudentCollections(queryClient, student);
      syncFormWithStudent(student);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (studentId) {
        queryClient.setQueryData(['student', studentId], student);
        setInfoMessage('Registro restaurado y activo.');
        setSubmitError('');
        setRestoreSuggestion(null);
      } else {
        navigate(`/estudiantes/${student.id}/editar`);
      }
    },
    onError: () => {
      setSubmitError('No se pudo restaurar el registro.');
      setInfoMessage('');
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: StudentPayload) =>
      studentId ? updateStudent(Number(studentId), payload) : createStudent(payload),
    onSuccess: (student) => {
      updateStudentCollections(queryClient, student);
      if (studentId) {
        queryClient.setQueryData(['student', studentId], student);
      }
      queryClient.setQueryData(['student', String(student.id)], student);
      setInfoMessage('');
      setRestoreSuggestion(null);
      navigate('/estudiantes');
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response) {
        const detail = extractErrorDetail(error.response.data);
        const normalizedDetail = detail.toLowerCase();

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

        if (error.response.status === 400) {
          if (normalizedDetail.includes('codigo_rude') && (normalizedDetail.includes('existe') || normalizedDetail.includes('registrad'))) {
            setFieldErrors((previous) => ({
              ...previous,
              codigo_rude: 'El código RUDE del estudiante ya está registrado.',
            }));
            setSubmitError('');
            return;
          }

          if (normalizedDetail.includes('persona') && normalizedDetail.includes('registrad')) {
            setSubmitError('La persona ingresada ya está registrada como estudiante.');
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
        setInfoMessage('');
        return;
      }

      setSubmitError('No se pudo guardar.');
      setInfoMessage('');
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
    setInfoMessage('');
    setRestoreSuggestion(null);

    if (isEditing && isInactive) {
      setSubmitError('Este registro está inactivo. Restaura el registro para poder editarlo.');
      return;
    }

    const trimmedCodigo = form.codigo_rude.trim();
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

    const payloadInput = {
      codigo_rude: trimmedCodigo,
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

    const payload: StudentPayload = {
      codigo_rude: result.data.codigo_rude,
      persona: personaPayload,
    };

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

  const updateTopLevelField = (field: 'codigo_rude' | 'anio_ingreso') => (value: string) => {
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

  const handleRestoreCurrent = () => {
    const id = currentStudent?.id ?? (studentId ? Number(studentId) : null);
    if (!id) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(id);
  };

  const handleRestoreSuggestion = () => {
    if (!restoreSuggestion || !restoreSuggestion.id) {
      return;
    }
    setSubmitError('');
    setInfoMessage('');
    restoreMutation.mutate(restoreSuggestion.id);
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
      {isEditing && studentQuery.data && (
        <div className="mb-4">
          <StudentSummary student={studentQuery.data} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="block text-sm font-medium text-gray-600">Datos de la persona</span>
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-nombres">
                  Nombres
                </label>
                <input
                  id="student-person-nombres"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.nombres}
                  onChange={(event) => updatePersonaField('nombres')(event.target.value)}
                />
                {fieldErrors.persona?.nombres && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.nombres}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-apellidos">
                  Apellidos
                </label>
                <input
                  id="student-person-apellidos"
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
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-sexo">
                  Sexo
                </label>
                <select
                  id="student-person-sexo"
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
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-fecha-nacimiento">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  id="student-person-fecha-nacimiento"
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
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-celular">
                  Celular
                </label>
                <input
                  id="student-person-celular"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.celular}
                  onChange={(event) => updatePersonaField('celular')(event.target.value)}
                />
                {fieldErrors.persona?.celular && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.celular}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-direccion">
                  Dirección
                </label>
                <input
                  id="student-person-direccion"
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
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-numero">
                  N° de CI (opcional)
                </label>
                <input
                  id="student-person-ci-numero"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.ci_numero}
                  onChange={(event) => updatePersonaField('ci_numero')(event.target.value)}
                />
                {fieldErrors.persona?.ci_numero && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.ci_numero}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-complemento">
                  Complemento
                </label>
                <input
                  id="student-person-ci-complemento"
                  className="w-full rounded border px-3 py-2"
                  value={form.persona.ci_complemento}
                  onChange={(event) => updatePersonaField('ci_complemento')(event.target.value)}
                />
                {fieldErrors.persona?.ci_complemento && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.persona.ci_complemento}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="student-person-ci-expedicion">
                  Expedición
                </label>
                <input
                  id="student-person-ci-expedicion"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="student-codigo">
              Código RUDE del estudiante
            </label>
            <input
              id="student-codigo"
              className="w-full border rounded px-3 py-2"
              value={form.codigo_rude}
              onChange={(event) => updateTopLevelField('codigo_rude')(event.target.value)}
              maxLength={50}
            />
            {fieldErrors.codigo_rude && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.codigo_rude}</p>
            )}
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
          {isEditing && (
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
          )}
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
