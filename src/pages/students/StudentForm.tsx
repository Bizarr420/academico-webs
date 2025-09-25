import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '@/app/services/api';

type StudentPayload = {
  ci: string;
  nombres: string;
  apellidos: string;
  curso: string;
};

export default function StudentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentPayload>({
    ci: '',
    nombres: '',
    apellidos: '',
    curso: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/students', form);
      navigate('/estudiantes');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? // @ts-expect-error Axios style error shape
            err.response?.data?.detail ?? 'No se pudo guardar'
          : 'No se pudo guardar';
      setError(typeof message === 'string' ? message : 'No se pudo guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof StudentPayload) => (value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 max-w-xl">
      <h1 className="text-lg font-semibold mb-4">Nuevo estudiante</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">CI</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.ci}
            onChange={(event) => updateField('ci')(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Nombres</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.nombres}
              onChange={(event) => updateField('nombres')(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Apellidos</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.apellidos}
              onChange={(event) => updateField('apellidos')(event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm">Curso/Paralelo</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.curso}
            onChange={(event) => updateField('curso')(event.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button className="px-3 py-2 rounded bg-gray-900 text-white" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
