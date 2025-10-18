import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAllCourses } from '@/app/services/courses';
import { createCourseParallel, getParallelsByCourse } from '@/app/services/parallels';
// import { createSubject } from '@/app/services/subjects';
import { getTeachers } from '@/app/services/teachers';
import { getAuthHeaders } from '@/app/services/api';
import type { Course, Teacher } from '@/app/types';

type LevelOption = 'PRIMARIA' | 'SECUNDARIA';

const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  'Matemática': 'MAT',
  'Literatura': 'LIT',
  'Inglés': 'ING',
  'Física': 'FIS',
  'Química': 'QUI',
  'Biología': 'BIO',
  'Historia': 'HIS',
  'Ciencias Sociales': 'CS',
  'Artes Plásticas': 'ART',
  'Música': 'MUS',
  'Educación Física': 'EF',
  'Formación Cristiana': 'FC',
};

const makeCode = (subjectName: string, year: number, suffix?: string) => {
  const abbr = SUBJECT_ABBREVIATIONS[subjectName] || subjectName
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'MAT';
  const sfx = suffix ? `-${suffix}` : '';
  return `${abbr}-${year}${sfx}`.slice(0, 20);
};

export default function SubjectQuickCreate() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nombre?: string; codigo?: string }>({});

  const ALLOWED_SUBJECTS = [
    'Matemática',
    'Literatura',
    'Inglés',
    'Física',
    'Química',
    'Biología',
    'Historia',
    'Ciencias Sociales',
    'Artes Plásticas',
    'Música',
    'Educación Física',
    'Formación Cristiana',
  ] as const;

  const [nombre, setNombre] = useState<(typeof ALLOWED_SUBJECTS)[number] | ''>('');
  const [codigo, setCodigo] = useState('');
  const [nivel, setNivel] = useState<LevelOption>('SECUNDARIA');
  const [cursoId, setCursoId] = useState<string>('');
  const [paralelo, setParalelo] = useState('A');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [docenteId, setDocenteId] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllCourses(),
      getTeachers({ page: 1, page_size: 1000, estado: 'ACTIVO' } as any).then((p) => p.items).catch(() => []),
    ])
      .then(([coursesData, teachersData]) => {
        setCourses(coursesData);
        setTeachers(teachersData as Teacher[]);
        // Selección inicial acorde al nivel
        const filtered = coursesData.filter((c) => (c.nivel?.toLowerCase?.() || '').includes(nivel.toLowerCase()));
        if (filtered.length > 0) {
          setCursoId(String(filtered[0].id));
        }
      })
      .catch((err) => setError(err?.message || 'No se pudieron cargar cursos o docentes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!nombre) {
      setCodigo('');
      return;
    }
    const year = new Date().getFullYear();
    setCodigo(makeCode(nombre, year));
  }, [nombre]);

  const filteredCourses = useMemo(() => {
    const allowedNames = new Set(['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto']);
    return courses.filter((c) => {
      const label = (c.nivel || '').toString().toLowerCase();
      const okNivel = nivel === 'PRIMARIA' ? label.includes('primaria') : label.includes('secundaria');
      const courseName = (c.nombre || '').toString().toLowerCase();
      const okGrado = allowedNames.has(courseName);
      return okNivel && okGrado;
    });
  }, [courses, nivel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const nombreTrim = String(nombre).trim();
      if (nombreTrim.length < 2) throw new Error('Ingresa el nombre de la materia');
      const cursoIdNum = Number(cursoId);
      if (!cursoIdNum) throw new Error('Selecciona un curso');
      const parName = (paralelo || 'A').trim();
      const docenteIdNum = Number(docenteId) || null;

      // 1) Crear materia (manejo de duplicados de código)
      const year = new Date().getFullYear();
      let code = (codigo || makeCode(nombreTrim, year)).slice(0, 20);
      let createdSubject: any;
      const createViaFetch = async (nombreVal: string, codigoVal: string) => {
        const res = await fetch('/api/materias', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nombreVal, codigo: codigoVal, estado: 'ACTIVO' }),
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw Object.assign(new Error('create_subject_failed'), { status: res.status, detail });
        }
        return res.json();
      };
      try {
        createdSubject = await createViaFetch(nombreTrim, code);
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const detailObj = (err?.detail?.detail ?? err?.detail) as any;
        const errCode: string = (detailObj?.error || detailObj?.code || '').toString().toLowerCase();
        // Caso nombre duplicado (409 ó 400 con error nombre_en_uso)
        if ((status === 409 || status === 400) && errCode.includes('nombre')) {
          const msg = detailObj?.mensaje || detailObj?.message || 'Nombre de materia ya registrado';
          setFieldErrors((prev) => ({ ...prev, nombre: msg }));
          throw new Error(msg);
        }
        // Caso integridad/código duplicado (puede venir como 400 INTEGRITY_ERROR)
        const looksLikeCodeDup =
          (status === 409 && errCode.includes('codigo')) ||
          (status === 400 && (errCode.includes('integrity') || errCode.includes('integridad') || errCode.includes('codigo')));
        if (looksLikeCodeDup) {
          const nextCode = makeCode(nombreTrim, year, Math.random().toString(36).slice(2, 6).toUpperCase());
          setFieldErrors((prev) => ({ ...prev, codigo: `Codigo en uso. Se genero automaticamente: ${nextCode}` }));
          setCodigo(nextCode);
          createdSubject = await createViaFetch(nombreTrim, nextCode);
          code = nextCode;
        } else {
          // Propaga otros 400 con mensaje del backend
          const serverMsg = detailObj?.mensaje || detailObj?.message || 'No se pudo crear la materia';
          throw new Error(serverMsg);
        }
      }

      // 2) Crear paralelo si no existe en el curso
      let paraleloId: number | null = null;
      try {
        const existing = await getParallelsByCourse(cursoIdNum);
        const match = existing.find((p) => (p.nombre || '').toUpperCase() === parName.toUpperCase());
        if (match) {
          paraleloId = match.id;
        } else {
          const created = await createCourseParallel(cursoIdNum, parName);
          paraleloId = created.id;
        }
      } catch (_) {
        // ignorar si ya existe / restricción a nivel global
      }

      // 3) Asociar materia al curso vía plan (opcional)
      try {
        await fetch('/api/planes/', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ curso_id: cursoIdNum, materia_id: createdSubject.id }),
        });
      } catch (_) {}

      // 4) Crear asignación si hay docente y paralelo disponible y una gestión activa
      if (docenteIdNum && paraleloId) {
        try {
          // Buscar la gestión activa más reciente
          const res = await fetch('/api/gestiones/?estado=ACTIVO&limit=1', { headers: getAuthHeaders() });
          let gestionId: number | null = null;
          if (res.ok) {
            const data = (await res.json()) as Array<{ id: number; nombre: string }>;
            if (Array.isArray(data) && data.length > 0) {
              gestionId = data[0].id;
            }
          }
          if (gestionId) {
            const payload = {
              gestion_id: gestionId,
              docente_id: docenteIdNum,
              materia_id: createdSubject.id,
              curso_id: cursoIdNum,
              paralelo_id: paraleloId,
              estado: 'ACTIVO',
            };
            await fetch('/api/asignaciones/', {
              method: 'POST',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          }
        } catch (_) {
          // opcional
        }
      }

      navigate('/cursos/demo', { replace: true });
    } catch (err: any) {
      const e = err ?? {};
      const serverMsg =
        e?.detail?.detail?.mensaje || e?.detail?.mensaje || e?.detail?.detail?.message || e?.detail?.message || e?.message || 'No se pudo crear la materia';
      setError(typeof serverMsg === 'string' ? serverMsg : 'No se pudo crear la materia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando…</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4 text-neutral-800">Nueva materia</h1>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-gradient-to-br from-white to-neutral-100 p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-600">Materia</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value as any)}
          >
            <option value="">Selecciona una materia</option>
            {ALLOWED_SUBJECTS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {fieldErrors.nombre && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.nombre}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Código (máx. 20)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={codigo}
            maxLength={20}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="AUTOGENERADO"
          />
          {fieldErrors.codigo && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.codigo}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Nivel</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={nivel}
            onChange={(e) => setNivel(e.target.value as LevelOption)}
          >
            <option value="PRIMARIA">Primaria</option>
            <option value="SECUNDARIA">Secundaria</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Curso</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
          >
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Docente</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={docenteId}
            onChange={(e) => setDocenteId(e.target.value)}
          >
            <option value="">Selecciona un docente (opcional)</option>
            {teachers
              .filter((t) => {
                const spec = (t.profesion || '').toLowerCase();
                const subj = String(nombre || '').toLowerCase();
                return spec.includes(subj) || spec.includes(SUBJECT_ABBREVIATIONS[String(nombre)]?.toLowerCase?.() || '');
              })
              .map((t) => {
                const fullName = `${t.persona?.nombres ?? ''} ${t.persona?.apellidos ?? ''}`.trim() || `Docente #${t.id}`;
                const label = t.profesion ? `${fullName} — ${t.profesion}` : fullName;
                return (
                  <option key={t.id} value={t.id}>
                    {label}
                  </option>
                );
              })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Paralelo</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={paralelo}
            onChange={(e) => setParalelo(e.target.value)}
            placeholder="A, B, C…"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => navigate('/cursos/demo')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 rounded text-white bg-gradient-to-r from-neutral-900 to-neutral-700 hover:from-neutral-800 hover:to-neutral-600 disabled:opacity-50" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
