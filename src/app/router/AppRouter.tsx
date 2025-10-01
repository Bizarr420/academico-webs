import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/app/components/Layout';
import { useAuth } from '@/app/hooks/useAuth';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
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
import PeopleList from '@/pages/people/PeopleList';
import PersonForm from '@/pages/people/PersonForm';
import UsersList from '@/pages/users/UsersList';
import UserForm from '@/pages/users/UserForm';
import AuditLog from '@/pages/audit/AuditLog';

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route path="estudiantes" element={<StudentsList />} />
          <Route path="estudiantes/nuevo" element={<StudentForm />} />
          <Route path="estudiantes/:studentId/editar" element={<StudentForm />} />
          <Route path="docentes" element={<TeachersList />} />
          <Route path="docentes/nuevo" element={<TeacherForm />} />
          <Route path="docentes/:teacherId/editar" element={<TeacherForm />} />
          <Route path="personas" element={<PeopleList />} />
          <Route path="personas/nuevo" element={<PersonForm />} />
          <Route path="personas/:personId/editar" element={<PersonForm />} />
          <Route path="cursos" element={<CoursesList />} />
          <Route path="cursos/nuevo" element={<CourseForm />} />
          <Route path="cursos/:courseId/editar" element={<CourseForm />} />
          <Route path="materias" element={<SubjectsList />} />
          <Route path="materias/nuevo" element={<SubjectForm />} />
          <Route path="materias/:subjectId/editar" element={<SubjectForm />} />
          <Route path="usuarios" element={<UsersList />} />
          <Route path="usuarios/nuevo" element={<UserForm />} />
          <Route path="usuarios/:userId/editar" element={<UserForm />} />
          <Route path="auditoria" element={<AuditLog />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
