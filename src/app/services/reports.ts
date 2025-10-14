import api, { withTrailingSlash } from '@/app/services/api';
import type {
  CourseReportAnalytics,
  CourseReportFilters,
  CourseReportMetric,
  CourseReportRow,
  CourseReportSummaryBlock,
  CourseReportTrendPoint,
  StudentReportFilters,
  StudentReportKpi,
  StudentReportSummary,
  StudentReportTrendPoint,
} from '@/app/types';

const STUDENT_REPORT_ENDPOINT = '/reportes/estudiante';
const COURSE_REPORT_ENDPOINT = '/reportes/curso';

type ApiStudentReport =
  | StudentReportSummary
  | {
      resumen?: {
        estudiante?: string;
        materia?: string;
        promedio?: number;
      } | null;
      kpis?: StudentReportKpi[] | null;
      series?: {
        tendencia?: StudentReportTrendPoint[] | null;
        comparativo?: StudentReportTrendPoint[] | null;
      } | null;
      tendencia?: StudentReportTrendPoint[] | null;
      comparativa?: StudentReportTrendPoint[] | null;
    };

const normalizeStudentReport = (data: ApiStudentReport): StudentReportSummary => {
  if ('resumen' in data && data.resumen) {
    const resumen = data.resumen ?? {};
    const tendencia =
      data.series?.tendencia ?? data.tendencia ?? ([] as StudentReportTrendPoint[]);
    const comparativa = data.series?.comparativo ?? data.comparativa ?? undefined;

    return {
      estudiante: resumen.estudiante ?? '—',
      materia: resumen.materia ?? '—',
      promedio: typeof resumen.promedio === 'number' ? resumen.promedio : 0,
      kpis: Array.isArray(data.kpis) ? data.kpis : [],
      tendencia: Array.isArray(tendencia) ? tendencia : [],
      comparativa: Array.isArray(comparativa) ? comparativa : undefined,
      series: {
        tendencia: Array.isArray(tendencia) ? tendencia : [],
        comparativo: Array.isArray(comparativa) ? comparativa : undefined,
      },
    } satisfies StudentReportSummary;
  }

  const legacy = data as StudentReportSummary;
  return {
    ...legacy,
    comparativa: (legacy as { comparativa?: StudentReportTrendPoint[] }).comparativa,
    series: {
      tendencia: legacy.tendencia,
      comparativo: (legacy as { comparativa?: StudentReportTrendPoint[] }).comparativa,
    },
  } satisfies StudentReportSummary;
};

type ApiCourseReport =
  | CourseReportRow[]
  | {
      resumen?: Partial<CourseReportSummaryBlock> | null;
      kpis?: CourseReportMetric[] | null;
      series?: {
        tendencia?: CourseReportTrendPoint[] | null;
        aprobacion?: CourseReportTrendPoint[] | null;
      } | null;
      resultados?: CourseReportRow[] | null;
      filas?: CourseReportRow[] | null;
      items?: CourseReportRow[] | null;
      data?: CourseReportRow[] | null;
    };

const sumReducer = (rows: CourseReportRow[], key: 'aprobados' | 'reprobados') =>
  rows.reduce((total, row) => total + (typeof row[key] === 'number' ? row[key] : 0), 0);

const average = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }
  const validValues = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (validValues.length === 0) {
    return null;
  }
  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
};

const normalizeCourseReport = (data: ApiCourseReport): CourseReportAnalytics => {
  if (Array.isArray(data)) {
    const registros = data.length;
    const promedioGeneral = average(data.map((row) => row.promedio));
    return {
      resumen: {
        registros,
        promedio_general: promedioGeneral,
        aprobados: sumReducer(data, 'aprobados'),
        reprobados: sumReducer(data, 'reprobados'),
      },
      kpis: [],
      series: {},
      filas: data,
    } satisfies CourseReportAnalytics;
  }

  const candidateRows = data.resultados ?? data.filas ?? data.items ?? data.data ?? [];
  const rows = Array.isArray(candidateRows) ? candidateRows : [];

  const registros = typeof data.resumen?.registros === 'number' ? data.resumen!.registros : rows.length;
  const promedioGeneral =
    typeof data.resumen?.promedio_general === 'number'
      ? data.resumen?.promedio_general ?? null
      : average(rows.map((row) => row.promedio));

  const aprobados =
    typeof data.resumen?.aprobados === 'number'
      ? data.resumen?.aprobados ?? null
      : rows.length > 0
      ? sumReducer(rows, 'aprobados')
      : null;

  const reprobados =
    typeof data.resumen?.reprobados === 'number'
      ? data.resumen?.reprobados ?? null
      : rows.length > 0
      ? sumReducer(rows, 'reprobados')
      : null;

  const tendenciaSerie = Array.isArray(data.series?.tendencia)
    ? data.series?.tendencia ?? undefined
    : undefined;
  const aprobacionSerie = Array.isArray(data.series?.aprobacion)
    ? data.series?.aprobacion ?? undefined
    : undefined;

  return {
    resumen: {
      registros,
      promedio_general: promedioGeneral,
      aprobados,
      reprobados,
    },
    kpis: Array.isArray(data.kpis) ? data.kpis : [],
    series: {
      tendencia: tendenciaSerie,
      aprobacion: aprobacionSerie,
    },
    filas: rows,
  } satisfies CourseReportAnalytics;
};

export async function getStudentReport(filters: StudentReportFilters) {
  const { data } = await api.get<ApiStudentReport>(withTrailingSlash(STUDENT_REPORT_ENDPOINT), {
    params: filters,
  });

  return normalizeStudentReport(data);
}

export async function getCourseReport(filters: CourseReportFilters) {
  const { data } = await api.get<ApiCourseReport>(withTrailingSlash(COURSE_REPORT_ENDPOINT), {
    params: filters,
  });

  return normalizeCourseReport(data);
}

