import { isAxiosError } from 'axios';

const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta de nuevo.';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa la información ingresada. Hay datos inválidos.',
  PERMISSION_DENIED: 'No tienes permisos para realizar esta acción.',
  PERMISSION_ERROR: 'No tienes permisos para realizar esta acción.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  CONFLICT: 'Ya existe un registro con los mismos datos.',
  DUPLICATE_ASSIGNMENT: 'Ya existe una asignación con la misma combinación.',
  DUPLICATE_GRADE: 'La calificación ya fue registrada anteriormente.',
};

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'Ya existe un registro con la misma información.',
  422: 'Los datos enviados no son válidos.',
  500: 'El servidor encontró un problema. Intenta nuevamente.',
};

const extractDetailFromResponse = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const detail = (data as Record<string, unknown>).detail;
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail.trim();
  }

  const message = (data as Record<string, unknown>).message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim();
  }

  return null;
};

export const resolveApiErrorMessage = (error: unknown, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (isAxiosError(error)) {
    const response = error.response;

    if (response?.data) {
      const detail = extractDetailFromResponse(response.data);
      if (detail) {
        return detail;
      }

      const code = (response.data as Record<string, unknown>).code;
      if (typeof code === 'string') {
        const normalized = code.trim().toUpperCase();
        if (ERROR_CODE_MESSAGES[normalized]) {
          return ERROR_CODE_MESSAGES[normalized];
        }
      }
    }

    if (response?.status && STATUS_MESSAGES[response.status]) {
      return STATUS_MESSAGES[response.status];
    }

    if (typeof response?.statusText === 'string' && response.statusText.trim().length > 0) {
      return response.statusText.trim();
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

export const isConflictError = (error: unknown) => {
  if (!isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (status === 409) {
    return true;
  }

  const code = (error.response?.data as Record<string, unknown> | undefined)?.code;
  if (typeof code === 'string') {
    return code.trim().toUpperCase() === 'CONFLICT';
  }

  return false;
};

