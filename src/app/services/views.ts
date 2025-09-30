import api, { withTrailingSlash } from '@/app/services/api';
import type { ApiView, View } from '@/app/types';

const VIEWS_ENDPOINT = '/v1/vistas';

export const mapView = (view: ApiView): View => ({
  id: view.id,
  nombre: view.nombre,
  codigo: view.codigo,
  descripcion: view.descripcion ?? null,
});

export async function getViews() {
  const { data } = await api.get<ApiView[]>(withTrailingSlash(VIEWS_ENDPOINT));
  return data.map(mapView);
}
