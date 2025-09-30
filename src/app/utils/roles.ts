import type { Role } from '@/app/types';

const ROLE_ALIASES: Record<string, Role> = {
  admin: 'admin',
  administrador: 'admin',
  adm: 'admin',
  docente: 'docente',
  doc: 'docente',
  profesor: 'docente',
  profe: 'docente',
  maestro: 'docente',
  padre: 'padre',
  pad: 'padre',
  apoderado: 'padre',
};

const ROLE_PREFIX_PATTERN = /^(role|rol)[\s._-]*/u;

const sanitizeRole = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  const withoutPrefix = normalized.replace(ROLE_PREFIX_PATTERN, '');
  const candidate = withoutPrefix || normalized;

  return candidate.replace(/\s+/g, ' ').trim();
};

export const normalizeRole = (role: Role | string): Role => {
  const raw = typeof role === 'string' ? role : `${role}`;
  const sanitized = sanitizeRole(raw);
  const alias = ROLE_ALIASES[sanitized];

  if (alias) {
    return alias;
  }

  const compact = sanitized.replace(/[\s._-]+/g, '');
  const compactAlias = ROLE_ALIASES[compact];

  if (compactAlias) {
    return compactAlias;
  }

  return sanitized as Role;
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  padre: 'Padre',
};
