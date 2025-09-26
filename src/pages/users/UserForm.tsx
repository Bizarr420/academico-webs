import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { getAllPeople } from '@/app/services/people';
import { createUser, getUser, updateUser } from '@/app/services/users';
import type { Person, Role, UserPayload } from '@/app/types';

const userSchema = z.object({
  username: z.string().min(3, 'Ingresa el nombre de usuario'),
  role: z.enum(['admin', 'docente', 'padre']),
  persona_id: z.number().int('Selecciona una persona').min(1, 'Selecciona una persona'),
  email: z.string().email('Ingresa un correo válido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
});

type UserFormState = {
  username: string;
  role: Role;
  personaId: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<{
  username: string;
  role: string;
  persona_id: string;
  email: string;
  password: string;
}>;

const initialValues: UserFormState = {
  username: '',
  role: 'docente',
  personaId: '',
  email: '',
  password: '',
};

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  padre: 'Padre',
};

export default function UserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const isEditing = Boolean(userId);
  const [form, setForm] = useState<UserFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const peopleQuery = useQuery({
    queryKey: ['people', 'all'],
    queryFn: async () => getAllPeople(),
  });

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => (userId ? getUser(Number(userId)) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (userQuery.data) {
      setForm({
        username: userQuery.data.username,
        role: userQuery.data.role,
        personaId: userQuery.data.persona?.id?.toString() ?? userQuery.data.persona_id?.toString() ?? '',
        email: userQuery.data.email ?? '',
        password: '',
      });
    }
  }, [userQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: UserPayload) =>
      userId ? updateUser(Number(userId), payload) : createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
      }
      navigate('/usuarios');
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

    const personaIdNumber = Number(form.personaId);

    const result = userSchema.safeParse({
      username: form.username.trim(),
      role: form.role,
      persona_id: Number.isNaN(personaIdNumber) ? 0 : personaIdNumber,
      email: form.email.trim() || undefined,
      password: form.password.trim() || undefined,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in newErrors)) {
          newErrors[field as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      return;
    }

    if (!isEditing && !result.data.password) {
      setFieldErrors({ password: 'Ingresa una contraseña' });
      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const updateField = <TField extends keyof UserFormState>(field: TField) => (value: UserFormState[TField]) => {
    setFieldErrors((previous) => {
      const targetField = field === 'personaId' ? 'persona_id' : field;
      if (!previous[targetField as keyof FieldErrors]) {
        return previous;
      }
      const next = { ...previous };
      delete next[targetField as keyof FieldErrors];
      return next;
    });
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  if (isEditing && userQuery.isLoading) {
    return <p>Cargando usuario…</p>;
  }

  if (isEditing && userQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del usuario.</p>;
  }

  const title = isEditing ? 'Editar usuario' : 'Nuevo usuario';

  const peopleOptions = useMemo<Person[]>(() => {
    if (!peopleQuery.data) {
      return [];
    }
    return [...peopleQuery.data].sort((a, b) => {
      const nameA = `${a.apellidos} ${a.nombres}`.trim().toLowerCase();
      const nameB = `${b.apellidos} ${b.nombres}`.trim().toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }, [peopleQuery.data]);

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="user-username">
              Usuario
            </label>
            <input
              id="user-username"
              className="w-full border rounded px-3 py-2"
              value={form.username}
              onChange={(event) => updateField('username')(event.target.value)}
            />
            {fieldErrors.username && <p className="text-sm text-red-600 mt-1">{fieldErrors.username}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="user-role">
              Rol
            </label>
            <select
              id="user-role"
              className="w-full border rounded px-3 py-2"
              value={form.role}
              onChange={(event) => updateField('role')(event.target.value as Role)}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fieldErrors.role && <p className="text-sm text-red-600 mt-1">{fieldErrors.role}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="user-persona">
            Persona vinculada
          </label>
          <select
            id="user-persona"
            className="w-full border rounded px-3 py-2"
            value={form.personaId}
            onChange={(event) => updateField('personaId')(event.target.value)}
            disabled={peopleQuery.isLoading}
          >
            <option value="">Selecciona una persona…</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {`${person.apellidos} ${person.nombres}`.trim()} {person.ci ? `• ${person.ci}` : ''}
              </option>
            ))}
          </select>
          {peopleQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar las personas.</p>
          )}
          {fieldErrors.persona_id && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.persona_id}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="user-email">
              Correo electrónico
            </label>
            <input
              id="user-email"
              className="w-full border rounded px-3 py-2"
              value={form.email}
              onChange={(event) => updateField('email')(event.target.value)}
            />
            {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="user-password">
              Contraseña {isEditing && <span className="text-xs text-gray-500">(opcional)</span>}
            </label>
            <input
              type="password"
              id="user-password"
              className="w-full border rounded px-3 py-2"
              value={form.password}
              onChange={(event) => updateField('password')(event.target.value)}
              placeholder={isEditing ? 'Dejar en blanco para mantener' : ''}
            />
            {fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
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
