import { Link, useLocation } from 'react-router-dom';

export default function Forbidden() {
  const location = useLocation();
  const from =
    typeof location.state === 'object' && location.state !== null && 'from' in location.state
      ? (location.state as { from?: string }).from
      : undefined;

  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <h1 className="text-3xl font-bold text-gray-900">403</h1>
      <p className="mt-2 text-lg font-semibold text-gray-800">No tienes permiso para ver esta sección.</p>
      {from && (
        <p className="mt-1 text-sm text-gray-500">Intentaste acceder a: <code>{from}</code></p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to={from && from !== '/403' ? from : '/'}
          className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Volver
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
