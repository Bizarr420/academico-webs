# Checklists operativos

## Seeds y variables de entorno

- [x] Variables cargadas desde `.env`:
  - `VITE_API_URL`
  - `VITE_APP_ENV`
- [x] Seeds ejecutados en backend:
  - Roles y vistas base (`admin`, `ASIGNACIONES`, `NOTAS`, `REPORTES`, `ALERTAS`)
  - Cursos, paralelos y materias para combinar filtros
  - Docentes y estudiantes activos para pruebas
- [x] Token de servicio válido para autenticación inicial
- [x] Usuario administrador creado y disponible en `localStorage`

## Smoke tests backend

- [x] `GET /asignaciones/` responde 200 con estructura paginada
- [x] `POST /asignaciones/` crea registro y controla duplicados (409)
- [x] `GET /notas/unitarias/` con filtros válidos devuelve evaluaciones y estudiantes
- [x] Flujo masivo: `/notas/masivas/` → `/preview` → `/confirm` funciona con archivo de ejemplo
- [x] `GET /reportes/estudiante/` entrega KPIs y tendencia
- [x] `GET /reportes/curso/` devuelve promedios por paralelo
- [x] `POST /alertas/{id}/estado` actualiza estado con comentario y audita

## Smoke tests frontend

- [x] Login con usuario válido redirige al dashboard
- [x] Asignaciones: crear, editar y eliminar muestra feedback y actualiza tabla
- [x] Calificaciones unitarias: modificar tres notas y guardar
- [x] Calificaciones masivas: subir archivo con 1 error; se visualiza en vista previa
- [x] Reportes: generar reporte por estudiante y exportar reporte por curso
- [x] Alertas: cambiar estado y ver actualización inmediata

