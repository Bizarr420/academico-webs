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

const INVALID_ROLE_VALUES = new Set(['', 'undefined', 'null', 'none', 'ninguno']);

export const normalizeRole = (role: Role | string | null | undefined): Role | null => {
  if (role === null || role === undefined) {
    return null;
  }

  const raw = typeof role === 'string' ? role : `${role}`;
  const sanitized = sanitizeRole(raw);

  if (INVALID_ROLE_VALUES.has(sanitized)) {
    return null;
  }

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

const capitalizeWord = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

export const resolveRoleLabel = (role: Role | string | null | undefined): string => {
  const normalized = normalizeRole(role);

  if (!normalized) {
    return '';
  }

  const label = ROLE_LABELS[normalized];

  if (label) {
    return label;
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
};
