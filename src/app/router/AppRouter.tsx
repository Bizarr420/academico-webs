import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/app/components/Layout';
import { useAuth } from '@/app/hooks/useAuth';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { RequireView } from '@/app/router/RequireView';
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
import Forbidden from '@/pages/Forbidden';
import AssignmentsPage from '@/pages/assignments/AssignmentsPage';
import GradesPage from '@/pages/grades/GradesPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AlertsPage from '@/pages/alerts/AlertsPage';
import CursosDemo from '@/pages/CursosDemo';
import SubjectQuickCreate from '@/pages/subjects/SubjectQuickCreate';

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route
            path="estudiantes"
            element={
              <RequireView code="MATRICULAS">
                <StudentsList />
              </RequireView>
            }
          />
          <Route
            path="estudiantes/nuevo"
            element={
              <RequireView code="MATRICULAS">
                <StudentForm />
              </RequireView>
            }
          />
          <Route
            path="estudiantes/:studentId/editar"
            element={
              <RequireView code="MATRICULAS">
                <StudentForm />
              </RequireView>
            }
          />
          <Route
            path="docentes"
            element={
              <RequireView code="DOCENTES">
                <TeachersList />
              </RequireView>
            }
          />
          <Route
            path="docentes/nuevo"
            element={
              <RequireView code="DOCENTES">
                <TeacherForm />
              </RequireView>
            }
          />
          <Route
            path="docentes/:teacherId/editar"
            element={
              <RequireView code="DOCENTES">
                <TeacherForm />
              </RequireView>
            }
          />
          <Route
            path="personas"
            element={
              <RequireView code={["PERSONAS", "USUARIOS"]}>
                <PeopleList />
              </RequireView>
            }
          />
          <Route
            path="personas/nuevo"
            element={
              <RequireView code={["PERSONAS", "USUARIOS"]}>
                <PersonForm />
              </RequireView>
            }
          />
          <Route
            path="personas/:personId/editar"
            element={
              <RequireView code={["PERSONAS", "USUARIOS"]}>
                <PersonForm />
              </RequireView>
            }
          />
          <Route
            path="cursos"
            element={
              <RequireView code="CURSOS">
                <CoursesList />
              </RequireView>
            }
          />
          <Route
            path="cursos/demo"
            element={<CursosDemo />}
          />
          <Route
            path="cursos/demo/nueva-materia"
            element={
              <RequireView code="MATERIAS">
                <SubjectQuickCreate />
              </RequireView>
            }
          />
          <Route
            path="cursos/nuevo"
            element={
              <RequireView code="CURSOS">
                <CourseForm />
              </RequireView>
            }
          />
          <Route
            path="cursos/:courseId/editar"
            element={
              <RequireView code="CURSOS">
                <CourseForm />
              </RequireView>
            }
          />
          <Route
            path="materias"
            element={
              <RequireView code="MATERIAS">
                <SubjectsList />
              </RequireView>
            }
          />
          <Route
            path="materias/nuevo"
            element={
              <RequireView code="MATERIAS">
                <SubjectForm />
              </RequireView>
            }
          />
          <Route
            path="materias/:subjectId/editar"
            element={
              <RequireView code="MATERIAS">
                <SubjectForm />
              </RequireView>
            }
          />
          <Route
            path="usuarios"
            element={
              <RequireView code="USUARIOS">
                <UsersList />
              </RequireView>
            }
          />
          <Route
            path="usuarios/nuevo"
            element={
              <RequireView code="USUARIOS">
                <UserForm />
              </RequireView>
            }
          />
          <Route
            path="usuarios/:userId/editar"
            element={
              <RequireView code="USUARIOS">
                <UserForm />
              </RequireView>
            }
          />
          <Route
            path="auditoria"
            element={
              <RequireView code="AUDITORIA">
                <AuditLog />
              </RequireView>
            }
          />
          <Route
            path="asignaciones"
            element={
              <RequireView code="ASIGNACIONES">
                <AssignmentsPage />
              </RequireView>
            }
          />
          <Route
            path="calificaciones"
            element={
              <RequireView code="NOTAS">
                <GradesPage />
              </RequireView>
            }
          />
          <Route
            path="reportes"
            element={
              <RequireView code="REPORTES">
                <ReportsPage />
              </RequireView>
            }
          />
          <Route
            path="alertas"
            element={
              <RequireView code="ALERTAS">
                <AlertsPage />
              </RequireView>
            }
          />
          <Route path="403" element={<Forbidden />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
