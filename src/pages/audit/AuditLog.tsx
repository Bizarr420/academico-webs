import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AUDIT_LOG_PAGE_SIZE, getAuditLog } from '@/app/services/audit';
import type { AuditLogEntry } from '@/app/types';

const SEARCH_DEBOUNCE_MS = 300;

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['audit-log', page, debouncedSearch],
    queryFn: async () =>
      getAuditLog({
        page,
        search: debouncedSearch || undefined,
        page_size: AUDIT_LOG_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const entries: AuditLogEntry[] = data?.items ?? [];
  const pageSize = data?.page_size ?? AUDIT_LOG_PAGE_SIZE;
  const isEmpty = !isLoading && !isError && entries.length === 0;
  const disablePrevious = page === 1 || isFetching;
  const disableNext = entries.length < pageSize || isFetching;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Bitácora de auditoría</h1>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="audit-search">
          Buscar
        </label>
        <input
          id="audit-search"
          placeholder="Buscar por acción, recurso o usuario…"
          className="border rounded px-3 py-2 w-full"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && <p>Cargando…</p>}
      {isError && <p className="text-red-600">Error al cargar la bitácora.</p>}
      {isFetching && !isLoading && <p className="text-sm text-gray-500">Actualizando…</p>}
      {isEmpty && <p className="text-sm text-gray-500">No se encontraron registros.</p>}

      {entries.length > 0 && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Acción</th>
                <th>Recurso</th>
                <th>Usuario</th>
                <th>Fecha y hora</th>
                <th>Dispositivo / IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const formattedDate = (() => {
                  try {
                    return dateTimeFormatter.format(new Date(entry.timestamp));
                  } catch {
                    return entry.timestamp;
                  }
                })();
                const deviceInfo = [entry.device, entry.ip].filter(Boolean).join(' • ');
                return (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-2">{entry.action}</td>
                    <td className="max-w-xs truncate" title={entry.resource}>
                      {entry.resource}
                    </td>
                    <td>{entry.actor}</td>
                    <td>{formattedDate}</td>
                    <td className="max-w-xs truncate" title={deviceInfo || undefined}>
                      {deviceInfo || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center gap-2 justify-end mt-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={disablePrevious}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((current) => current + 1)}
              disabled={disableNext}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
