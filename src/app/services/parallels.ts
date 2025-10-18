import api, { withAuth, withTrailingSlash } from '@/app/services/api';
import type { CourseParallel, CourseParallelPayload } from '@/app/types';

const PARALLELS_ENDPOINT = 'paralelos';

export async function createParallel(payload: CourseParallelPayload) {
  const { data } = await api.post<CourseParallel>(PARALLELS_ENDPOINT, payload, withAuth());
  return data;
}

export async function getParallelsByCourse(courseId: number) {
  const { data } = await api.get<CourseParallel[]>(`${PARALLELS_ENDPOINT}?curso_id=${courseId}`, withAuth());
  return data;
}

// Create a parallel scoped to a course using the CURSOS permission
export async function createCourseParallel(courseId: number, nombre: string) {
  const { data } = await api.post<CourseParallel>(
    `${withTrailingSlash('cursos')}${courseId}/paralelos`,
    { nombre },
    withAuth(),
  );
  return data;
}
