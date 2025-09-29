import { NavLink } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';

const linkBase = 'block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors';
const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} bg-gray-200 font-semibold` : `${linkBase} text-gray-700`;

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

const navItems = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'docente', 'padre'] },
  { to: '/estudiantes', label: 'Estudiantes', roles: ['admin', 'docente'] },
  { to: '/docentes', label: 'Docentes', roles: ['admin'] },
  { to: '/personas', label: 'Personas', roles: ['admin'] },
  { to: '/cursos', label: 'Cursos', roles: ['admin'] },
  { to: '/materias', label: 'Materias', roles: ['admin'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['admin'] },
  { to: '/roles', label: 'Roles', roles: ['admin'] },
  { to: '/auditoria', label: 'Auditoría', roles: ['admin'] },
];

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const { user } = useAuth();

  const allowedItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  if (!user) {
    return null;
  }

  return (
    <aside className={`w-64 bg-white p-4 flex flex-col gap-6 overflow-y-auto ${className}`}>
      <div className="font-bold text-xl">Académico</div>
      <nav className="space-y-1">
        {allowedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={linkClassName}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
