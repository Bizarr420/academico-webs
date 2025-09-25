import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Layout from '@/app/components/Layout';
import StudentsList from '@/pages/students/StudentsList';
import StudentForm from '@/pages/students/StudentForm';
import { useAuth } from '@/app/hooks/useAuth';
import { Role } from '@/app/types';


function ProtectedRoute() {
const { isAuthenticated } = useAuth();
if (!isAuthenticated) return <Navigate to="/login" replace />;
return <Outlet />;
}


function RoleGuard({ allowed }: { allowed: Role[] }) {
const { user } = useAuth();
if (!user) return <Navigate to="/login" replace />;
if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
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
<Route element={<RoleGuard allowed={["admin"]} />}>
{/* Ejemplo: rutas de maestros, cursos, materias, etc. */}
</Route>
</Route>
</Route>


<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
);
}