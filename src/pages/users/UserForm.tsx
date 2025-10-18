import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { getAllRoles } from '@/app/services/roles';
import { createUser, getUser, updateUser } from '@/app/services/users';
import type { RoleSummary, UserPayload } from '@/app/types';
import type { PersonPayload } from '@/app/types';

const personaSchema = z.object({
  nombres: z.string().min(1, 'Ingresa nombres'),
  apellidos: z.string().min(1, 'Ingresa apellidos'),
  sexo: z.string().min(1, 'Selecciona sexo'),
  fecha_nacimiento: z.string().min(1, 'Selecciona fecha'),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  ci_numero: z.string().optional(),
  ci_complemento: z.string().optional(),
  ci_expedicion: z.string().optional(),
});

const userSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50, 'El nombre de usuario no puede exceder 50 caracteres'),
  rol_id: z.number().int('Selecciona un rol').min(1, 'Selecciona un rol'),
  email: z.string().email('Ingresa un correo válido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  persona: personaSchema.optional(),
  persona_id: z.number().optional(),
});


type PersonaFormState = {
  nombres: string;
  apellidos: string;
  sexo: string;
  fecha_nacimiento: string;
  celular: string;
  direccion: string;
  ci_numero: string;
  ci_complemento: string;
  ci_expedicion: string;
};

type UserFormState = {
  username: string;
  rolId: string;
  email: string;
  password: string;
  persona: PersonaFormState;
  personaId: string;
  estado: 'ACTIVO' | 'INACTIVO' | '';
};

type FieldErrors = Partial<{
  username: string;
  persona_id: string;
  rol_id: string;
  email: string;
  password: string;
}>;

const initialPersona: PersonaFormState = {
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

const initialValues: UserFormState = {
  username: '',
  rolId: '',
  email: '',
  password: '',
  persona: { ...initialPersona },
  personaId: '',
  estado: 'ACTIVO',
};

export default function UserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const isEditing = Boolean(userId);
  const [form, setForm] = useState<UserFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  // Removed peopleQuery, not needed for persona creation

  const rolesQuery = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => getAllRoles(),
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
        rolId: userQuery.data.rol_id != null ? userQuery.data.rol_id.toString() : '',
        email: userQuery.data.email ?? '',
        password: '',
        persona: {
          nombres: userQuery.data.persona?.nombres ?? '',
          apellidos: userQuery.data.persona?.apellidos ?? '',
          sexo: userQuery.data.persona?.sexo ?? '',
          fecha_nacimiento: userQuery.data.persona?.fecha_nacimiento ?? '',
          celular: userQuery.data.persona?.celular ?? '',
          direccion: userQuery.data.persona?.direccion ?? '',
          ci_numero: userQuery.data.persona?.ci_numero ?? '',
          ci_complemento: userQuery.data.persona?.ci_complemento ?? '',
          ci_expedicion: userQuery.data.persona?.ci_expedicion ?? '',
        },
        personaId: userQuery.data.persona?.id?.toString() ?? userQuery.data.persona_id?.toString() ?? '',
        estado: (userQuery.data.estado === 'ACTIVO' || userQuery.data.estado === 'INACTIVO') ? userQuery.data.estado : 'ACTIVO',
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
    
    const rolIdNumber = Number(form.rolId);
    if (Number.isNaN(rolIdNumber)) {
      setFieldErrors({ rol_id: 'Selecciona un rol válido' });
      return;
    }

    let result;
    if (!isEditing) {
      // Validate persona for new user
      result = userSchema.safeParse({
        username: form.username.trim(),
        rol_id: rolIdNumber,
        email: form.email.trim() || undefined,
        password: form.password.trim() || undefined,
        persona: {
          ...form.persona,
        },
      });
    } else {
      // Editing: use persona_id
      const personaIdNumber = Number(form.personaId);
      result = userSchema.safeParse({
        username: form.username.trim(),
        persona_id: Number.isNaN(personaIdNumber) ? undefined : personaIdNumber,
        rol_id: rolIdNumber,
        email: form.email.trim() || undefined,
        password: form.password.trim() || undefined,
        estado: form.estado || undefined,
      });
    }

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
    let payload: UserPayload;
    if (!isEditing) {
      // Ensure persona fields are present and sexo is valid
      const personaRaw = result.data.persona as PersonaFormState;
      const persona: PersonPayload = {
        nombres: personaRaw.nombres,
        apellidos: personaRaw.apellidos,
        sexo: typeof personaRaw.sexo === 'string' && ['M', 'F', 'X'].includes(personaRaw.sexo) ? personaRaw.sexo as 'M'|'F'|'X' : 'M',
        fecha_nacimiento: personaRaw.fecha_nacimiento,
        celular: personaRaw.celular,
        direccion: personaRaw.direccion,
        ci_numero: personaRaw.ci_numero,
        ci_complemento: personaRaw.ci_complemento,
        ci_expedicion: personaRaw.ci_expedicion,
      };
      payload = {
        username: result.data.username,
        rol_id: result.data.rol_id,
        email: result.data.email,
        password: result.data.password,
        persona,
      };
    } else {
      payload = {
        username: result.data.username,
        persona_id: result.data.persona_id ?? 0,
        rol_id: result.data.rol_id,
        email: result.data.email,
        password: result.data.password,
        persona: {
          ...form.persona,
          sexo: (['M', 'F', 'X'].includes(form.persona.sexo) ? form.persona.sexo : 'M') as 'M' | 'F' | 'X',
        },
      };
    }
    mutation.mutate(payload);
  };

  const updateField = <TField extends keyof UserFormState>(field: TField) => (value: UserFormState[TField]) => {
    setFieldErrors((previous) => {
      const targetField = field === 'rolId' ? 'rol_id' : field;
      if (!previous[targetField as keyof FieldErrors]) {
        return previous;
      }
      const next = { ...previous };
      delete next[targetField as keyof FieldErrors];
      return next;
    });
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updatePersonaField = <TField extends keyof PersonaFormState>(field: TField) => (value: PersonaFormState[TField]) => {
    setForm((previous) => ({ ...previous, persona: { ...previous.persona, [field]: value } }));
  };

  // peopleOptions removed, not needed for persona creation

  const roleOptions = useMemo<RoleSummary[]>(() => {
    if (!rolesQuery.data) {
      return [];
    }
    return [...rolesQuery.data].sort((a, b) => {
      const nameA = a.nombre.toLowerCase();
      const nameB = b.nombre.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }, [rolesQuery.data]);

  if (isEditing && userQuery.isLoading) {
    return <p>Cargando usuario…</p>;
  }

  if (isEditing && userQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del usuario.</p>;
  }

  const title = isEditing ? 'Editar usuario' : 'Nuevo usuario';

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
        </div>
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-nombres">Nombres</label>
              <input id="persona-nombres" className="w-full border rounded px-3 py-2" value={form.persona.nombres} onChange={e => updatePersonaField('nombres')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-apellidos">Apellidos</label>
              <input id="persona-apellidos" className="w-full border rounded px-3 py-2" value={form.persona.apellidos} onChange={e => updatePersonaField('apellidos')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-sexo">Sexo</label>
              <select id="persona-sexo" className="w-full border rounded px-3 py-2" value={form.persona.sexo} onChange={e => updatePersonaField('sexo')(e.target.value)}>
                <option value="">Selecciona sexo…</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-fecha-nacimiento">Fecha de nacimiento</label>
              <input id="persona-fecha-nacimiento" type="date" className="w-full border rounded px-3 py-2" value={form.persona.fecha_nacimiento} onChange={e => updatePersonaField('fecha_nacimiento')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-celular">Celular</label>
              <input id="persona-celular" className="w-full border rounded px-3 py-2" value={form.persona.celular} onChange={e => updatePersonaField('celular')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-direccion">Dirección</label>
              <input id="persona-direccion" className="w-full border rounded px-3 py-2" value={form.persona.direccion} onChange={e => updatePersonaField('direccion')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-numero">CI Número</label>
              <input id="persona-ci-numero" className="w-full border rounded px-3 py-2" value={form.persona.ci_numero} onChange={e => updatePersonaField('ci_numero')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-complemento">CI Complemento</label>
              <input id="persona-ci-complemento" className="w-full border rounded px-3 py-2" value={form.persona.ci_complemento} onChange={e => updatePersonaField('ci_complemento')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-expedicion">CI Expedición</label>
              <input id="persona-ci-expedicion" className="w-full border rounded px-3 py-2" value={form.persona.ci_expedicion} onChange={e => updatePersonaField('ci_expedicion')(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-nombres">Nombres</label>
              <input id="persona-nombres" className="w-full border rounded px-3 py-2" value={form.persona.nombres} onChange={e => updatePersonaField('nombres')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-apellidos">Apellidos</label>
              <input id="persona-apellidos" className="w-full border rounded px-3 py-2" value={form.persona.apellidos} onChange={e => updatePersonaField('apellidos')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-sexo">Sexo</label>
              <select id="persona-sexo" className="w-full border rounded px-3 py-2" value={form.persona.sexo} onChange={e => updatePersonaField('sexo')(e.target.value)}>
                <option value="">Selecciona sexo…</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-fecha-nacimiento">Fecha de nacimiento</label>
              <input id="persona-fecha-nacimiento" type="date" className="w-full border rounded px-3 py-2" value={form.persona.fecha_nacimiento} onChange={e => updatePersonaField('fecha_nacimiento')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-celular">Celular</label>
              <input id="persona-celular" className="w-full border rounded px-3 py-2" value={form.persona.celular} onChange={e => updatePersonaField('celular')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-direccion">Dirección</label>
              <input id="persona-direccion" className="w-full border rounded px-3 py-2" value={form.persona.direccion} onChange={e => updatePersonaField('direccion')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-numero">CI Número</label>
              <input id="persona-ci-numero" className="w-full border rounded px-3 py-2" value={form.persona.ci_numero} onChange={e => updatePersonaField('ci_numero')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-complemento">CI Complemento</label>
              <input id="persona-ci-complemento" className="w-full border rounded px-3 py-2" value={form.persona.ci_complemento} onChange={e => updatePersonaField('ci_complemento')(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="persona-ci-expedicion">CI Expedición</label>
              <input id="persona-ci-expedicion" className="w-full border rounded px-3 py-2" value={form.persona.ci_expedicion} onChange={e => updatePersonaField('ci_expedicion')(e.target.value)} />
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="user-rol">
              Rol
            </label>
            <select
              id="user-rol"
              className="w-full border rounded px-3 py-2"
              value={form.rolId}
              onChange={(event) => updateField('rolId')(event.target.value)}
              disabled={rolesQuery.isLoading}
            >
              <option value="">Selecciona un rol…</option>
              {roleOptions.filter(role => role.estado === 'ACTIVO').map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
            {rolesQuery.isError && (
              <p className="text-sm text-red-600 mt-1">No se pudieron cargar los roles.</p>
            )}
            {rolesQuery.isSuccess && roleOptions.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Registra un rol antes de crear usuarios.</p>
            )}
            {fieldErrors.rol_id && <p className="text-sm text-red-600 mt-1">{fieldErrors.rol_id}</p>}
          </div>
          
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-600" htmlFor="user-estado">
                Estado
              </label>
              <select
                id="user-estado"
                className="w-full border rounded px-3 py-2"
                value={form.estado}
                onChange={(e) => {
                  const newEstado = e.target.value as 'ACTIVO' | 'INACTIVO';
                  setForm((prev) => ({ ...prev, estado: newEstado }));
                }}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          )}
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
