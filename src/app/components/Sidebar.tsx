import { NavLink } from 'react-router-dom';


const linkBase = "block px-3 py-2 rounded-lg hover:bg-gray-100";
const active = ({ isActive }: { isActive: boolean }) => isActive ? `${linkBase} bg-gray-200` : linkBase;


export default function Sidebar() {
return (
<aside className="w-64 h-screen sticky top-0 border-r bg-white p-4">
<div className="font-bold text-xl mb-6">Académico</div>
<nav className="space-y-1">
<NavLink to="/" className={active}>Dashboard</NavLink>
<NavLink to="/estudiantes" className={active}>Estudiantes</NavLink>
{/* Agregar Docentes, Cursos, Materias, Calificaciones, Asistencia, Reportes, Alertas */}
</nav>
</aside>
);
}