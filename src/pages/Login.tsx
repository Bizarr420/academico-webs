import { FormEvent, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useNavigate } from 'react-router-dom';


export default function Login() {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const { login } = useAuth();
const navigate = useNavigate();


const onSubmit = async (e: FormEvent) => {
e.preventDefault();
setError('');
setLoading(true);
try {
await login(username, password);
navigate('/');
} catch (err: any) {
setError(err?.response?.data?.detail || 'Credenciales inválidas');
} finally {
setLoading(false);
}
};


return (
<div className="min-h-screen grid place-items-center bg-gray-50 p-4">
<form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
<h1 className="text-xl font-bold mb-4">Iniciar sesión</h1>
<label className="block text-sm mb-1">Usuario</label>
<input className="w-full border rounded px-3 py-2 mb-3" value={username} onChange={e => setUsername(e.target.value)} />
<label className="block text-sm mb-1">Contraseña</label>
<input type="password" className="w-full border rounded px-3 py-2 mb-4" value={password} onChange={e => setPassword(e.target.value)} />
{error && <p className="text-red-600 text-sm mb-2">{error}</p>}
<button disabled={loading} className="w-full py-2 rounded bg-gray-900 text-white">
{loading ? 'Ingresando…' : 'Ingresar'}
</button>
</form>
</div>
);
}