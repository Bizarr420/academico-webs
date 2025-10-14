import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import FormDrawer from '@/app/components/FormDrawer';
import BaseAcademicFilters, { type BaseFilterValues } from '@/app/components/BaseAcademicFilters';
import type { Assignment, AssignmentPayload } from '@/app/types';
import { createAssignment, updateAssignment } from '@/app/services/assignments';
import { resolveApiErrorMessage, isConflictError } from '@/app/utils/errors';

type AssignmentFormProps = {
  open: boolean;
  assignment?: Assignment | null;
  onClose: () => void;
  onSaved: (assignment: Assignment) => void;
};

type FormState = BaseFilterValues & {
  fecha_inicio: string;
  fecha_fin: string;
};

const createInitialState = (assignment?: Assignment | null): FormState => ({
  periodo_id: assignment?.periodo_id ?? null,
  curso_id: assignment?.curso_id ?? null,
  paralelo_id: assignment?.paralelo_id ?? null,
  materia_id: assignment?.materia_id ?? null,
  docente_id: assignment?.docente_id ?? null,
  search: '',
  fecha_inicio: assignment?.fecha_inicio ?? '',
  fecha_fin: assignment?.fecha_fin ?? '',
});

export default function AssignmentForm({ open, assignment, onClose, onSaved }: AssignmentFormProps) {
  const [state, setState] = useState<FormState>(createInitialState(assignment));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setState(createInitialState(assignment));
      setErrorMessage(null);
    }
  }, [open, assignment]);

  const title = assignment ? 'Editar asignación' : 'Nueva asignación';

  const isArchived = assignment?.activo === false;

  const canSubmit = useMemo(() => {
    if (isArchived) {
      return false;
    }

    return (
      typeof state.periodo_id === 'number' &&
      typeof state.curso_id === 'number' &&
      typeof state.materia_id === 'number' &&
      typeof state.docente_id === 'number'
    );
  }, [isArchived, state]);

  const mutation = useMutation({
    mutationFn: async (payload: AssignmentPayload) =>
      assignment ? updateAssignment(assignment.id, payload) : createAssignment(payload),
    onSuccess: (result) => {
      setErrorMessage(null);
      onSaved(result);
    },
    onError: (error) => {
      if (isConflictError(error)) {
        setErrorMessage('Ya existe una asignación con la misma combinación.');
      } else {
        setErrorMessage(resolveApiErrorMessage(error, 'No se pudo guardar la asignación.'));
      }
    },
  });

  const handleFiltersChange = (changes: Partial<BaseFilterValues>) => {
    setState((prev: FormState) => ({ ...prev, ...changes }));
  };

  const handleDateChange = (key: 'fecha_inicio' | 'fecha_fin') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setState((prev: FormState) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = () => {
    if (isArchived) {
      setErrorMessage('Esta asignación está archivada y no puede modificarse.');
      return;
    }

    if (!canSubmit) {
      setErrorMessage('Completa los campos requeridos.');
      return;
    }

    const payload: AssignmentPayload = {
      curso_id: state.curso_id!,
      paralelo_id: state.paralelo_id ?? null,
      materia_id: state.materia_id!,
      docente_id: state.docente_id!,
      periodo_id: state.periodo_id!,
      fecha_inicio: state.fecha_inicio || null,
      fecha_fin: state.fecha_fin || null,
    };

    mutation.mutate(payload);
  };

  return (
    <FormDrawer
      title={title}
      isOpen={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      error={errorMessage}
      submitLabel={assignment ? 'Actualizar' : 'Crear'}
    >
      {isArchived && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Esta asignación está archivada. Para modificarla primero debes reactivarla desde el backend.
        </div>
      )}
      <BaseAcademicFilters
        values={state}
        onChange={handleFiltersChange}
        showTeacher
        showSearch={false}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600" htmlFor="assignment-start">
            Fecha de inicio
          </label>
          <input
            id="assignment-start"
            type="date"
            className="border rounded px-3 py-2"
            value={state.fecha_inicio}
            onChange={handleDateChange('fecha_inicio')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600" htmlFor="assignment-end">
            Fecha de fin
          </label>
          <input
            id="assignment-end"
            type="date"
            className="border rounded px-3 py-2"
            value={state.fecha_fin}
            onChange={handleDateChange('fecha_fin')}
          />
        </div>
      </div>
    </FormDrawer>
  );
}

