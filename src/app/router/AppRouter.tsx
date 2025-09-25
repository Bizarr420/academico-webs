import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Layout from '@/app/components/Layout';
import { useAuth } from '@/app/hooks/useAuth';
import type { Role } from '@/app/types';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import StudentForm from '@/pages/students/StudentForm';
import StudentsList from '@/pages/students/StudentsList';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RoleGuard({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/estudiantes" element={<StudentsList />} />
          <Route path="/estudiantes/nuevo" element={<StudentForm />} />

          {/* Solo admin */}
          <Route element={<RoleGuard allowed={['admin']} />}>
            {/* Ejemplo: rutas de maestros, cursos, materias, etc. */}
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
