import { NavLink } from 'react-router-dom';

const linkBase = 'block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors';
const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} bg-gray-200 font-semibold` : `${linkBase} text-gray-700`;

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-white p-4 flex flex-col gap-6">
      <div className="font-bold text-xl">Académico</div>
      <nav className="space-y-1">
        <NavLink to="/" end className={linkClassName}>
          Dashboard
        </NavLink>
        <NavLink to="/estudiantes" className={linkClassName}>
          Estudiantes
        </NavLink>
        <NavLink to="/docentes" className={linkClassName}>
          Docentes
        </NavLink>
        <NavLink to="/cursos" className={linkClassName}>
          Cursos
        </NavLink>
        <NavLink to="/materias" className={linkClassName}>
          Materias
        </NavLink>
      </nav>
    </aside>
  );
}
