export interface StatusLike {
  estado?: string | null;
  activo?: boolean | null;
}

export interface StatusInfo {
  isActive: boolean | null;
  label: string;
  source: 'estado' | 'activo' | 'unknown';
}

const normalizeEstado = (estado: string) => estado.trim().toUpperCase();

export function resolveStatus({ estado, activo }: StatusLike): StatusInfo {
  if (typeof estado === 'string' && estado.trim().length > 0) {
    const normalized = normalizeEstado(estado);
    if (normalized === 'ACTIVO') {
      return { isActive: true, label: normalized, source: 'estado' };
    }
    if (normalized === 'INACTIVO') {
      return { isActive: false, label: normalized, source: 'estado' };
    }
    return { isActive: null, label: normalized, source: 'estado' };
  }

  if (typeof activo === 'boolean') {
    return {
      isActive: activo,
      label: activo ? 'Activo' : 'Inactivo',
      source: 'activo',
    };
  }

  return { isActive: null, label: '', source: 'unknown' };
}

export const isActiveStatus = (status: StatusLike): boolean => resolveStatus(status).isActive !== false;
export const isInactiveStatus = (status: StatusLike): boolean => resolveStatus(status).isActive === false;
