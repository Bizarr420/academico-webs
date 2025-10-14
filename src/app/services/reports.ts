import api, { withTrailingSlash } from '@/app/services/api';
import type {
  CourseReportFilters,
  CourseReportRow,
  StudentReportFilters,
  StudentReportSummary,
} from '@/app/types';

const STUDENT_REPORT_ENDPOINT = '/reportes/estudiante';
const COURSE_REPORT_ENDPOINT = '/reportes/curso';

export async function getStudentReport(filters: StudentReportFilters) {
  const { data } = await api.get<StudentReportSummary>(withTrailingSlash(STUDENT_REPORT_ENDPOINT), {
    params: filters,
  });

  return data;
}

export async function getCourseReport(filters: CourseReportFilters) {
  const { data } = await api.get<CourseReportRow[]>(withTrailingSlash(COURSE_REPORT_ENDPOINT), {
    params: filters,
  });

  return data;
}

