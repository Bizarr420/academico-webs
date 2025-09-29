import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createRole, getAvailableRoleViews, getRole, updateRole } from '@/app/services/roles';
import type { RolePayload, RoleView } from '@/app/types';

const roleSchema = z.object({
  nombre: z.string().min(3, 'Ingresa un nombre para el rol'),
  descripcion: z.string().optional(),
  vista_ids: z.array(z.number().int()).optional(),
});

type RoleFormState = {
  nombre: string;
  descripcion: string;
  vistaIds: string[];
};

type FieldErrors = Partial<{
  nombre: string;
  descripcion: string;
  vista_ids: string;
}>;

const initialValues: RoleFormState = {
  nombre: '',
  descripcion: '',
  vistaIds: [],
};

export default function RoleForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { roleId } = useParams();
  const isEditing = Boolean(roleId);
  const [form, setForm] = useState<RoleFormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  const roleQuery = useQuery({
    queryKey: ['role', roleId],
    queryFn: async () => (roleId ? getRole(Number(roleId)) : null),
    enabled: isEditing,
  });

  const viewsQuery = useQuery({
    queryKey: ['role-views'],
    queryFn: async () => getAvailableRoleViews(),
  });

  useEffect(() => {
    if (roleQuery.data) {
      setForm({
        nombre: roleQuery.data.nombre,
        descripcion: roleQuery.data.descripcion ?? '',
        vistaIds: roleQuery.data.vista_ids.map((id) => id.toString()),
      });
    }
  }, [roleQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: RolePayload) =>
      roleId ? updateRole(Number(roleId), payload) : createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      if (roleId) {
        queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      }
      navigate('/roles');
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

    const result = roleSchema.safeParse({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      vista_ids: form.vistaIds.map((value) => Number(value)).filter((value) => !Number.isNaN(value)),
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

    const payload: RolePayload = {
      nombre: result.data.nombre,
      descripcion: result.data.descripcion,
      vista_ids: result.data.vista_ids ?? [],
    };

    mutation.mutate(payload);
  };

  const updateField = (field: keyof RoleFormState) => (value: string | string[]) => {
    setFieldErrors((previous) => {
      if (!previous[field === 'vistaIds' ? 'vista_ids' : field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field === 'vistaIds' ? 'vista_ids' : field];
      return next;
    });

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  if (isEditing && roleQuery.isLoading) {
    return <p>Cargando rol…</p>;
  }

  if (isEditing && roleQuery.isError) {
    return <p className="text-red-600">No se pudo cargar la información del rol.</p>;
  }

  const title = isEditing ? 'Editar rol' : 'Nuevo rol';

  const availableViews = useMemo<RoleView[]>(() => viewsQuery.data ?? [], [viewsQuery.data]);

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="role-name">
              Nombre
            </label>
            <input
              id="role-name"
              className="w-full border rounded px-3 py-2"
              value={form.nombre}
              onChange={(event) => updateField('nombre')(event.target.value)}
            />
            {fieldErrors.nombre && <p className="text-sm text-red-600 mt-1">{fieldErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600" htmlFor="role-description">
              Descripción
            </label>
            <input
              id="role-description"
              className="w-full border rounded px-3 py-2"
              value={form.descripcion}
              onChange={(event) => updateField('descripcion')(event.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600" htmlFor="role-views">
            Vistas permitidas
          </label>
          <select
            id="role-views"
            multiple
            className="w-full border rounded px-3 py-2 min-h-32"
            value={form.vistaIds}
            onChange={(event) =>
              updateField('vistaIds')(
                Array.from(event.target.selectedOptions, (option) => option.value),
              )
            }
            disabled={viewsQuery.isLoading}
          >
            {availableViews.map((view) => (
              <option key={view.id} value={view.id.toString()}>
                {view.nombre} ({view.codigo})
              </option>
            ))}
          </select>
          {viewsQuery.isError && (
            <p className="text-sm text-red-600 mt-1">No se pudieron cargar las vistas disponibles.</p>
          )}
          {fieldErrors.vista_ids && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.vista_ids}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Mantén presionada la tecla Ctrl (Cmd en Mac) para seleccionar varias opciones.
          </p>
        </div>

        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
