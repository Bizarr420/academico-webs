# Contratos de API

## Asignaciones

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/asignaciones/` | Lista paginada filtrable por `periodo_id`, `curso_id`, `paralelo_id`, `materia_id`, `docente_id`, `search`, `estado` e `incluir_inactivos`. Respuesta normalizada: `{ items: Assignment[], total, page, page_size, estado?, activo?, eliminado_en?, relaciones? }`. |
| `POST` | `/asignaciones/` | Crea una asignación. Cuerpo: `{ curso_id, paralelo_id?, materia_id, docente_id, periodo_id, fecha_inicio?, fecha_fin? }`. Devuelve `Assignment`. Códigos: `201`, `409` por duplicados. |
| `PUT` | `/asignaciones/{id}` | Actualiza una asignación existente con el mismo cuerpo que el `POST`. |
| `DELETE` | `/asignaciones/{id}` | Archiva (soft delete) una asignación. Devuelve `204` y marca `activo=false`, `eliminado_en`. |

## Calificaciones unitarias

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/notas/unitarias/` | Requiere `periodo_id`, `curso_id`, `materia_id`. Opcional `paralelo_id`. Respuesta: `{ periodo_id, curso_id, materia_id, paralelo_id?, evaluaciones: [{ id, nombre, ponderacion? }], estudiantes: [{ estudiante_id, estudiante, codigo?, evaluaciones: [{ evaluacion_id, nota?, periodo_id }] }] }`. |
| `POST` | `/notas/unitarias/` | Registra calificaciones. Cuerpo: `{ periodo_id, curso_id, materia_id, paralelo_id?, calificaciones: [{ estudiante_id, evaluacion_id, nota? }] }`. Devuelve el mismo esquema de `GET`. |

## Calificaciones masivas

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/notas/masivas/` | Paso 1: recibe `file` (`multipart/form-data`), `periodo_id`, `curso_id`, `materia_id`, `paralelo_id?`. Respuesta: `{ upload_id, columns: string[], evaluaciones: [{ id, nombre }], registros_detectados? }`. |
| `POST` | `/notas/masivas/{upload_id}/preview` | Paso 2: recibe `{ identificador_estudiante: string, evaluaciones: { [evaluacion_id]: columna } }`. Devuelve `{ insertados, actualizados, errores: [{ fila, mensaje }], observaciones?: string[], filas: [{ fila, estudiante, estado, errores?, notas, observacion? }] }`. |
| `POST` | `/notas/masivas/{upload_id}/confirm` | Paso 3: confirma carga y devuelve `{ insertados, actualizados, errores: [{ fila, mensaje }], observaciones?: string[] }`. |

## Reportes

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/reportes/estudiante/` | Requiere `periodo_id`, `materia_id`, `estudiante_id`. Respuesta enriquecida: `{ resumen: { estudiante, materia, promedio }, kpis: [{ label, value, delta? }], series: { tendencia: [{ periodo, nota }], comparativo?: [{ periodo, nota }] } }`. |
| `GET` | `/reportes/curso/` | Filtrable por `periodo_id`, `curso_id`, `paralelo_id`, `materia_id`. Respuesta: `{ resumen: { registros, promedio_general?, aprobados?, reprobados? }, kpis?: [{ label, value, delta? }], series?: { tendencia?: [{ etiqueta, valor }], aprobacion?: [{ etiqueta, valor }] }, resultados: CourseReportRow[] }`. |

## Alertas

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/alertas/` | Lista paginada filtrable por `periodo_id`, `curso_id`, `estado`, `search`, `page_size`. Respuesta: `{ items: Alert[], total, page, page_size, resumen: { por_estado, por_tipo }, observaciones: string[] }`. |
| `POST` | `/alertas/{id}/estado` | Actualiza el estado. Cuerpo: `{ estado, observacion?, comentario? }`. Respuesta: `Alert`. Códigos: `200`, `400` (validación), `403` (permisos). |

> Todas las rutas heredan la configuración global del cliente HTTP: encabezado `Authorization` con token Bearer, reintentos automáticos y manejo de respuesta `401` redirigiendo a `/login`.

