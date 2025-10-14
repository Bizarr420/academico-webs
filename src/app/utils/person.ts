import { SEX_LABELS, type Sexo } from '@/app/types';

const normalizeSexCode = (value: string) => value.trim().toUpperCase();

export const formatSexLabel = (value: string | null | undefined, fallback = '—'): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  const normalized = normalizeSexCode(trimmed);
  if (Object.prototype.hasOwnProperty.call(SEX_LABELS, normalized)) {
    return SEX_LABELS[normalized as Sexo];
  }

  return trimmed;
};

export default formatSexLabel;
