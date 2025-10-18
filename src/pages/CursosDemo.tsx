import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/app/services/api";
import { Link } from "react-router-dom";

const calificacionesDemo = [
  { nro: 1, nombre: "TICONA JOSE", practica1: 100, practica2: 100 },
  { nro: 2, nombre: "TICONA JOSE", practica1: 100, practica2: 100 },
  { nro: 3, nombre: "TICONA JOSE", practica1: 100, practica2: 100 },
  { nro: 4, nombre: "TICONA JOSE", practica1: 100, practica2: 100 },
];

type Paralelo = { id: number; nombre: string; curso_id: number };
type Curso = {
  id: number;
  nombre: string;
  paralelos?: { id: number; nombre: string }[];
  nivel?: { id: number; nombre: string } | null;
};
type Materia = { id: number; nombre: string };

type AsignacionDemo = {
  id: number;
  materia_id: number;
  curso_id: number;
  paralelo_id: number;
  materia_nombre: string;
  curso_nombre: string;
  paralelo_nombre: string;
};

const asistenciasDemo = [
  { nro: 1, nombre: "TICONA JOSE", asistencias: 18 },
  { nro: 2, nombre: "TICONA JOSE", asistencias: 18 },
  { nro: 3, nombre: "TICONA JOSE", asistencias: 18 },
  { nro: 4, nombre: "TICONA JOSE", asistencias: 18 },
];

function CursosDemo() {
  const [vista, setVista] = useState<{ tipo: "grid" | "calificaciones" | "asistencias"; asignacion?: AsignacionDemo }>({ tipo: "grid" });
  const [items, setItems] = useState<AsignacionDemo[]>([]);
  const [courses, setCourses] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nivel: "SECUNDARIA" as "PRIMARIA" | "SECUNDARIA",
    cursoId: "",
  });

  useEffect(() => {
    setLoading(true);
    const headers = getAuthHeaders();
    const load = async () => {
      try {
        // Cargar cursos (con paralelos), materias y asignaciones
        const [cursosRes, materiasRes, asignacionesRes] = await Promise.all([
          fetch("/api/cursos/", { headers }),
          fetch("/api/materias", { headers }),
          fetch("/api/asignaciones/", { headers }),
        ]);
        if (!cursosRes.ok) throw new Error("Error al obtener cursos");
        if (!materiasRes.ok) throw new Error("Error al obtener materias");
        if (!asignacionesRes.ok) throw new Error("Error al obtener asignaciones");

        const cursosJson = await cursosRes.json();
        const materias: Materia[] = await materiasRes.json();
        const asignaciones: { id: number; materia_id: number; curso_id: number; paralelo_id: number }[] = await asignacionesRes.json();

        const cursos: Curso[] = Array.isArray(cursosJson) ? cursosJson : cursosJson.items ?? [];

        // Mapas para nombres
        const mapCursoNombre = new Map<number, string>();
        const mapParalelo = new Map<number, Paralelo>();
        cursos.forEach((c) => {
          mapCursoNombre.set(c.id, c.nombre);
          (c.paralelos ?? []).forEach((p) => {
            mapParalelo.set(p.id, { id: p.id, nombre: p.nombre, curso_id: c.id });
          });
        });
        const mapMateriaNombre = new Map<number, string>(materias.map((m) => [m.id, m.nombre]));

        const list: AsignacionDemo[] = asignaciones.map((a) => {
          const par = mapParalelo.get(a.paralelo_id);
          return {
            id: a.id,
            materia_id: a.materia_id,
            curso_id: a.curso_id,
            paralelo_id: a.paralelo_id,
            materia_nombre: mapMateriaNombre.get(a.materia_id) ?? `Materia ${a.materia_id}`,
            curso_nombre: mapCursoNombre.get(a.curso_id) ?? `Curso ${a.curso_id}`,
            paralelo_nombre: par?.nombre ?? `Paralelo ${a.paralelo_id}`,
          };
        });

        setItems(list);
        setCourses(cursos);
        setError(null);
        // Inicializar curso por nivel por defecto si no hay selección
        if (!form.cursoId) {
          const filtered = cursos.filter((c: any) => {
            const label = (c.nivel?.nombre || "").toString().toLowerCase();
            return form.nivel === "PRIMARIA" ? label.includes("primaria") : label.includes("secundaria");
          });
          if (filtered.length > 0) {
            setForm((prev) => ({ ...prev, cursoId: String(filtered[0].id) }));
          }
        }
      } catch (err: any) {
        setError(err?.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-10 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-8">Materias (Demo)</h1>

      {loading && <div className="text-neutral-700">Cargando cursos...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {vista.tipo === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 -mt-2 -mb-4">
            <Link
              to="/cursos/demo/nueva-materia"
              className="px-6 py-2 rounded font-semibold shadow text-white bg-gradient-to-r from-neutral-900 to-neutral-700 hover:from-neutral-800 hover:to-neutral-600 transition"
            >
              Crear materia
            </Link>
          </div>
          
          {items.map((asg) => (
            <div
              key={asg.id}
              className="relative group bg-gradient-to-br from-neutral-50 via-white to-neutral-200 rounded-2xl border border-neutral-200 shadow-lg p-8 flex flex-col items-center justify-center min-h-[260px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute top-4 right-4 text-neutral-400 group-hover:text-neutral-600 transition">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.08" />
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex items-center justify-between w-full mb-8">
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-wide text-neutral-800 group-hover:text-neutral-900 transition">
                    {asg.materia_nombre}
                  </span>
                  <span className="text-sm text-neutral-600">{asg.curso_nombre}</span>
                </div>
                <span className="bg-neutral-200 text-neutral-800 px-3 py-1 rounded-full text-sm font-semibold border border-neutral-300 ml-4">
                  {asg.paralelo_nombre}
                </span>
              </div>
              <div className="flex gap-8">
                <button
                  className="border border-neutral-400 bg-gradient-to-r from-white to-neutral-100 rounded-xl px-8 py-6 text-lg font-semibold text-neutral-800 shadow hover:from-neutral-50 hover:to-neutral-200 hover:border-neutral-600 hover:text-neutral-900 transition-all duration-150"
                  onClick={() => setVista({ tipo: "calificaciones", asignacion: asg })}
                >
                  CALIFICACIONES
                </button>
                <button
                  className="border border-neutral-400 bg-gradient-to-r from-white to-neutral-100 rounded-xl px-8 py-6 text-lg font-semibold text-neutral-800 shadow hover:from-neutral-50 hover:to-neutral-200 hover:border-neutral-600 hover:text-neutral-900 transition-all duration-150"
                  onClick={() => setVista({ tipo: "asistencias", asignacion: asg })}
                >
                  ASISTENCIAS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* <FormDrawer
        title="Nueva materia"
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        widthClassName="max-w-xl"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            try {
              const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' } as Record<string, string>;
              const nombre = form.nombre.trim();
              if (!nombre) throw new Error('Ingresa el nombre de la materia');
              const cursoId = Number(form.cursoId);
              if (!cursoId) throw new Error('Selecciona un curso');
              const paraleloNombre = (form.paralelo || 'A').trim();

              // 1) Crear materia (genera código simple desde el nombre)
              const makeCodigo = (base: string, suffix?: string) => {
                const core = base
                  .normalize('NFD')
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-+|-+$/g, '')
                  .slice(0, 16)
                  .toUpperCase();
                const sfx = suffix ? `-${suffix}` : '';
                const candidate = (core || 'MAT') + sfx;
                return candidate.length < 2 ? `MAT-${Date.now()}` : candidate.slice(0, 20);
              };
              let codigo = makeCodigo(nombre);
              const tryCreateMateria = async (): Promise<any> => {
                const res = await fetch('/api/materias', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ nombre, codigo, estado: 'ACTIVO' }),
                });
                if (res.ok) return res.json();
                const detail = await res.json().catch(() => ({} as any));
                // Si el backend indica código o nombre duplicado, agrega sufijo y reintenta una vez
                const code = detail?.detail?.error || detail?.error || '';
                if ((res.status === 409 || res.status === 400) && /codigo|nombre/i.test(code)) {
                  codigo = makeCodigo(nombre, Math.random().toString(36).slice(2, 6).toUpperCase());
                  const retry = await fetch('/api/materias', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ nombre, codigo, estado: 'ACTIVO' }),
                  });
                  if (retry.ok) return retry.json();
                  const detail2 = await retry.json().catch(() => ({}));
                  throw new Error(detail2?.detail?.mensaje || 'No se pudo crear la materia (duplicado)');
                }
                throw new Error(detail?.detail?.mensaje || 'No se pudo crear la materia');
              };
              const materia = await tryCreateMateria();

              // 2) Asegurar paralelo; si no existe en el curso, crearlo
              let paraleloId: number | null = null;
              try {
                const cursoRes = await fetch('/api/cursos/', { headers: getAuthHeaders() });
                const cursosJson = await cursoRes.json();
                const cursos: Curso[] = Array.isArray(cursosJson) ? cursosJson : cursosJson.items ?? [];
                const selected = cursos.find((c) => c.id === cursoId);
                const exists = selected?.paralelos?.find((p) => (p.nombre || '').toUpperCase() === paraleloNombre.toUpperCase());
                if (exists) {
                  paraleloId = exists.id;
                } else {
                  const parRes = await fetch(`/api/cursos/${cursoId}/paralelos`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ nombre: paraleloNombre }),
                  });
                  if (parRes.ok) {
                    const nuevo = await parRes.json();
                    paraleloId = nuevo.id;
                  }
                }
              } catch (_) {
                // Ignorar errores al crear/leer paralelos en el demo
              }

              // 3) Asociar materia al curso vía plan (si el permiso lo permite)
              try {
                await fetch('/api/planes/', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ curso_id: cursoId, materia_id: materia.id }),
                });
              } catch (_) {
                // opcional
              }

              // 4) Refrescar la grilla demo
              setShowCreate(false);
              setForm((prev) => ({ ...prev, nombre: '' }));
              setSaving(false);
              // recargar items
              setLoading(true);
              try {
                const [cursosRes, materiasRes, asignacionesRes] = await Promise.all([
                  fetch('/api/cursos/', { headers: getAuthHeaders() }),
                  fetch('/api/materias', { headers: getAuthHeaders() }),
                  fetch('/api/asignaciones/', { headers: getAuthHeaders() }),
                ]);
                const cursosJson = await cursosRes.json();
                const cursos: Curso[] = Array.isArray(cursosJson) ? cursosJson : cursosJson.items ?? [];
                const materias: Materia[] = await materiasRes.json();
                const asignaciones: { id: number; materia_id: number; curso_id: number; paralelo_id: number }[] = await asignacionesRes.json();

                const mapCursoNombre = new Map<number, string>();
                const mapParalelo = new Map<number, Paralelo>();
                cursos.forEach((c) => {
                  mapCursoNombre.set(c.id, c.nombre);
                  (c.paralelos ?? []).forEach((p) => mapParalelo.set(p.id, { id: p.id, nombre: p.nombre, curso_id: c.id }));
                });
                const mapMateriaNombre = new Map<number, string>(materias.map((m) => [m.id, m.nombre]));

                const list: AsignacionDemo[] = asignaciones.map((a) => {
                  const par = mapParalelo.get(a.paralelo_id);
                  return {
                    id: a.id,
                    materia_id: a.materia_id,
                    curso_id: a.curso_id,
                    paralelo_id: a.paralelo_id,
                    materia_nombre: mapMateriaNombre.get(a.materia_id) ?? `Materia ${a.materia_id}`,
                    curso_nombre: mapCursoNombre.get(a.curso_id) ?? `Curso ${a.curso_id}`,
                    paralelo_nombre: par?.nombre ?? `Paralelo ${a.paralelo_id}`,
                  };
                });
                // Si no hay asignación aún para la materia recién creada, agrega una tarjeta virtual (demo)
                if (!list.some((it) => it.materia_id === materia.id)) {
                  const cursoNombre = mapCursoNombre.get(cursoId) ?? `Curso ${cursoId}`;
                  list.push({
                    id: -Date.now(),
                    materia_id: materia.id,
                    curso_id: cursoId,
                    paralelo_id: paraleloId ?? -1,
                    materia_nombre: materia.nombre ?? nombre,
                    curso_nombre: cursoNombre,
                    paralelo_nombre: paraleloNombre,
                  });
                }
                setItems(list);
              } finally {
                setLoading(false);
              }
            } catch (err: any) {
              setSaving(false);
              setError(err?.message || 'No se pudo crear la materia');
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-600">Nombre de la materia</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Matemática"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Nivel</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.nivel}
              onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value as any }))}
            >
              <option value="PRIMARIA">Primaria</option>
              <option value="SECUNDARIA">Secundaria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Curso</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.cursoId}
              onChange={(e) => setForm((p) => ({ ...p, cursoId: e.target.value }))}
            >
              {courses
                .filter((c) => {
                  const label = (c.nivel?.nombre || '').toString().toLowerCase();
                  return form.nivel === 'PRIMARIA' ? label.includes('primaria') : label.includes('secundaria');
                })
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Paralelo</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.paralelo}
              onChange={(e) => setForm((p) => ({ ...p, paralelo: e.target.value }))}
              placeholder="A, B, C..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 border rounded"
              onClick={() => setShowCreate(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </FormDrawer> */}

      {vista.tipo === "calificaciones" && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              Calificaciones - {vista.asignacion?.materia_nombre} ({vista.asignacion?.curso_nombre} {vista.asignacion?.paralelo_nombre})
            </h2>
            <button className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setVista({ tipo: "grid" })}>
              Volver
            </button>
          </div>
          <table className="min-w-full border border-black mb-8">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1">Nro</th>
                <th className="border border-black px-2 py-1">Apellido y Nombre</th>
                <th className="border border-black px-2 py-1">Práctica 1</th>
                <th className="border border-black px-2 py-1">Práctica 2</th>
              </tr>
            </thead>
            <tbody>
              {calificacionesDemo.map((row) => (
                <tr key={row.nro}>
                  <td className="border border-black px-2 py-1 text-center">{row.nro}</td>
                  <td className="border border-black px-2 py-1">{row.nombre}</td>
                  <td className="border border-black px-2 py-1 text-center">{row.practica1}</td>
                  <td className="border border-black px-2 py-1 text-center">{row.practica2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista.tipo === "asistencias" && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              Asistencias - {vista.asignacion?.materia_nombre} ({vista.asignacion?.curso_nombre} {vista.asignacion?.paralelo_nombre})
            </h2>
            <button className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setVista({ tipo: "grid" })}>
              Volver
            </button>
          </div>
          <table className="min-w-full border border-black mb-8">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1">Nro</th>
                <th className="border border-black px-2 py-1">Apellido y Nombre</th>
                <th className="border border-black px-2 py-1">Asistencias</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasDemo.map((row) => (
                <tr key={row.nro}>
                  <td className="border border-black px-2 py-1 text-center">{row.nro}</td>
                  <td className="border border-black px-2 py-1">{row.nombre}</td>
                  <td className="border border-black px-2 py-1 text-center">{row.asistencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CursosDemo;
