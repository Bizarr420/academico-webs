import { NavLink } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';

const linkBase = 'block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors';
const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} bg-gray-200 font-semibold` : `${linkBase} text-gray-700`;

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

type NavItem = {
  to: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/estudiantes', label: 'Estudiantes' },
  { to: '/docentes', label: 'Docentes' },
  { to: '/personas', label: 'Personas' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/materias', label: 'Materias' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/auditoria', label: 'Auditoría' },
];

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <aside className={`w-64 bg-white p-4 flex flex-col gap-6 overflow-y-auto ${className}`}>
      <div className="font-bold text-xl">Académico</div>
      <nav className="space-y-1">
        {navItems.map((item) => (
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
