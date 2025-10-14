# Vistas y rutas del frontend

| Código de vista | Descripción | Rutas protegidas |
| --- | --- | --- |
| `ASIGNACIONES` | Gestión de asignaciones curso/materia/docente | `/asignaciones` |
| `NOTAS` | Registro unitario y masivo de calificaciones | `/calificaciones` |
| `REPORTES` | Reportes analíticos por estudiante y curso | `/reportes` |
| `ALERTAS` | Gestión y seguimiento de alertas académicas | `/alertas` |
| `MATRICULAS` | Matrículas y listado de estudiantes | `/estudiantes`, `/estudiantes/*` |
| `DOCENTES` | Administración de docentes | `/docentes`, `/docentes/*` |
| `PERSONAS` | Catálogo de personas | `/personas`, `/personas/*` |
| `USUARIOS` | Gestión de usuarios y acceso | `/usuarios`, `/usuarios/*` |
| `CURSOS` | Cursos y paralelos | `/cursos`, `/cursos/*` |
| `MATERIAS` | Materias | `/materias`, `/materias/*` |
| `AUDITORIA` | Bitácora de auditoría | `/auditoria` |

> Las rutas usan el guard `RequireView` para validar que el usuario tenga al menos una de las vistas listadas.

