import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError('Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUsername, trimmedPassword);
      navigate('/');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? // @ts-expect-error Axios style error shape
            err.response?.data?.detail ?? 'Credenciales inválidas'
          : 'Credenciales inválidas';
      setError(typeof message === 'string' ? message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow space-y-4">
        <div>
          <h1 className="text-xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-gray-600">Administra la plataforma académica.</p>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="login-username">
            Usuario
          </label>
          <input
            id="login-username"
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="login-password">
            Contraseña
          </label>
          <input
            type="password"
            id="login-password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full py-2 rounded bg-gray-900 text-white disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
