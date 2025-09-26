import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/app/components/Layout';
import { useAuth } from '@/app/hooks/useAuth';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { RoleGuard } from '@/app/router/RoleGuard';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import CourseForm from '@/pages/courses/CourseForm';
import CoursesList from '@/pages/courses/CoursesList';
import StudentForm from '@/pages/students/StudentForm';
import StudentsList from '@/pages/students/StudentsList';
import SubjectForm from '@/pages/subjects/SubjectForm';
import SubjectsList from '@/pages/subjects/SubjectsList';
import TeacherForm from '@/pages/teachers/TeacherForm';
import TeachersList from '@/pages/teachers/TeachersList';

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route element={<RoleGuard allowed={['admin', 'docente']} />}>
            <Route path="estudiantes" element={<StudentsList />} />
            <Route path="estudiantes/nuevo" element={<StudentForm />} />
            <Route path="estudiantes/:studentId/editar" element={<StudentForm />} />
          </Route>

          <Route element={<RoleGuard allowed={['admin']} />}>
            <Route path="docentes" element={<TeachersList />} />
            <Route path="docentes/nuevo" element={<TeacherForm />} />
            <Route path="docentes/:teacherId/editar" element={<TeacherForm />} />
            <Route path="cursos" element={<CoursesList />} />
            <Route path="cursos/nuevo" element={<CourseForm />} />
            <Route path="cursos/:courseId/editar" element={<CourseForm />} />
            <Route path="materias" element={<SubjectsList />} />
            <Route path="materias/nuevo" element={<SubjectForm />} />
            <Route path="materias/:subjectId/editar" element={<SubjectForm />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
