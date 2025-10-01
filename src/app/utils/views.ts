import type { ApiView, View } from '@/app/types';

export const normalizeViewCode = (code: ApiView['codigo'] | View['codigo'] | string) => {
  return `${code ?? ''}`.trim().toUpperCase();
};

export const normalizeViews = (views?: (ApiView | View)[] | null): View[] => {
  if (!Array.isArray(views)) {
    return [];
  }

  const map = new Map<string, View>();

  views.forEach((view, index) => {
    const code = normalizeViewCode(view.codigo);
    if (!code) {
      return;
    }

    const id = typeof view.id === 'number' ? view.id : index + 1;
    const nombre = typeof view.nombre === 'string' && view.nombre.trim() ? view.nombre : code;
    const descripcion =
      typeof view.descripcion === 'string' && view.descripcion.trim() ? view.descripcion : null;

    map.set(code, {
      id,
      nombre,
      codigo: code,
      descripcion,
    });
  });

  return Array.from(map.values());
};
