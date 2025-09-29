import api, { withTrailingSlash } from '@/app/services/api';
import type {
  ApiAuditLogEntry,
  AuditLogEntry,
  AuditLogFilters,
  Paginated,
} from '@/app/types';

export const AUDIT_LOG_PAGE_SIZE = 10;

const AUDIT_LOG_ENDPOINT = '/auditoria';

const mapAuditEntry = (entry: ApiAuditLogEntry): AuditLogEntry => ({
  id: entry.id,
  action: entry.accion,
  resource: entry.recurso,
  actor: entry.usuario,
  timestamp: entry.fecha,
  device: entry.dispositivo ?? null,
  ip: entry.ip ?? null,
});

export async function getAuditLog(filters: AuditLogFilters) {
  const { page, search, page_size = AUDIT_LOG_PAGE_SIZE } = filters;
  const params: Record<string, unknown> = {
    page,
    page_size,
  };

  if (typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const { data } = await api.get<Paginated<ApiAuditLogEntry>>(withTrailingSlash(AUDIT_LOG_ENDPOINT), {
    params,
  });

  return {
    ...data,
    items: data.items.map(mapAuditEntry),
  };
}
