import type { JSX } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';
import type { ViewCode } from '@/app/types';

const linkBase =
  'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm';
const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} bg-gray-200 font-semibold` : `${linkBase} text-gray-700`;

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

type IconProps = {
  className?: string;
};

type IconComponent = (props: IconProps) => JSX.Element;

type NavItem = {
  to: string;
  label: string;
  icon: IconComponent;
  permission?: ViewCode | ViewCode[] | null;
};

const IconHome: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 10.5 9-7.5 9 7.5V21a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 21z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" />
  </svg>
);

const IconUsers: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
    />
  </svg>
);

const IconId: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h15v13.5h-15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9h4.5M7.5 12h4.5M7.5 15h4.5" />
  </svg>
);

const IconBook: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 0 17.25 21H6.75A2.25 2.25 0 0 0 4.5 18.75z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5H15M8.25 10.5H15M8.25 13.5H12" />
  </svg>
);

const IconStack: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 8.25 4.5L12 12 3.75 7.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 12-8.25 4.5L3.75 12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 16.5-8.25 4.5-8.25-4.5" />
  </svg>
);

const IconShield: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3 4.5 6v5.25c0 4.358 2.912 8.385 7.028 9.75 4.116-1.365 7.028-5.392 7.028-9.75V6z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75 11.25 14.25 14.25 9.75" />
  </svg>
);

const IconAudit: IconComponent = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5h-2.5A1.75 1.75 0 0 0 4 6.25v12.5A1.75 1.75 0 0 0 5.75 20.5h12.5A1.75 1.75 0 0 0 20 18.75v-2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5v-1A1.5 1.5 0 0 1 9.75 2h2.5A1.5 1.5 0 0 1 13.75 3.5v1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h3.75M9 12h2.25M9 15h4.5M14.25 9h2.25" />
    <circle cx="17" cy="17" r="3" />
  </svg>
);

const navigationItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: IconHome, permission: null },
  { to: '/estudiantes', label: 'Estudiantes', icon: IconUsers, permission: 'MATRICULAS' },
  { to: '/docentes', label: 'Docentes', icon: IconUsers, permission: 'DOCENTES' },
  { to: '/personas', label: 'Personas', icon: IconId, permission: ['PERSONAS', 'USUARIOS'] },
  { to: '/cursos', label: 'Cursos', icon: IconBook, permission: 'CURSOS' },
  { to: '/materias', label: 'Materias', icon: IconStack, permission: 'MATERIAS' },
  { to: '/usuarios', label: 'Usuarios', icon: IconShield, permission: 'USUARIOS' },
  { to: '/auditoria', label: 'Auditoría', icon: IconAudit, permission: 'AUDITORIA' },
];

const hasPermission = (permission: NavItem['permission'], hasView: (code: ViewCode) => boolean) => {
  if (!permission) {
    return true;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  return permissions.some((code) => hasView(code));
};

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const { user, hasView } = useAuth();

  if (!user) {
    return null;
  }

  const items = navigationItems.filter((item) => hasPermission(item.permission, hasView));

  return (
    <aside className={`w-64 bg-white p-4 flex flex-col gap-6 overflow-y-auto ${className}`}>
      <div className="font-bold text-xl">Académico</div>
      <nav className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes accesos asignados.</p>
        ) : (
          items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClassName}
              onClick={onNavigate}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  );
}
