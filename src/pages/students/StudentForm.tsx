import { FormEvent, useState } from 'react';
import api from '@/app/services/api';
import { useNavigate } from 'react-router-dom';


export default function StudentForm() {
const navigate = useNavigate();
const [form, setForm] = useState({ ci: '', nombres: '', apellidos: '', curso: '' });
const [error, setError] = useState('');


const onSubmit = async (e: FormEvent) => {
e.preventDefault();
setError('');
try {
await api.post('/students', form);
navigate('/estudiantes');
} catch (err: any) {
setError(err?.response?.data?.detail || 'No se pudo guardar');
}
};


return (
<div className="bg-white rounded-2xl shadow p-4 max-w-xl">
<h1 className="text-lg font-semibold mb-4">Nuevo estudiante</h1>
<form onSubmit={onSubmit} className="space-y-3">
<div>
<label className="block text-sm">CI</label>
<input className="w-full border rounded px-3 py-2" value={form.ci}
onChange={e=>setForm(prev=>({...prev, ci: e.target.value}))}/>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
<div>
<label className="block text-sm">Nombres</label>
<input className="w-full border rounded px-3 py-2" value={form.nombres}
onChange={e=>setForm(prev=>({...prev, nombres: e.target.value}))}/>
</div>
<div>
<label className="block text-sm">Apellidos</label>
<input className="w-full border rounded px-3 py-2" value={form.apellidos}
onChange={e=>setForm(prev=>({...prev, apellidos: e.target.value}))}/>
</div>
</div>
<div>
<label className="block text-sm">Curso/Paralelo</label>
<input className="w-full border rounded px-3 py-2" value={form.curso}
onChange={e=>setForm(prev=>({...prev, curso: e.target.value}))}/>
</div>
{error && <p className="text-red-600 text-sm">{error}</p>}
<div className="flex gap-2 justify-end">
<button type="button" className="px-3 py-2 border rounded" onClick={()=>navigate(-1)}>Cancelar</button>
<button className="px-3 py-2 rounded bg-gray-900 text-white">Guardar</button>
</div>
</form>
</div>
);
}