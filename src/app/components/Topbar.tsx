import { useCallback, useMemo } from 'react';

import { useAuth } from '@/app/hooks/useAuth';
import { resolveRoleLabel } from '@/app/utils/roles';

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();

  const { displayName, roleLabel } = useMemo(() => {
    if (!user) {
      return { displayName: '', roleLabel: '' };
    }

    const name = typeof user.name === 'string' && user.name.trim() ? user.name.trim() : null;
    const username = typeof user.username === 'string' && user.username.trim() ? user.username.trim() : null;
    const displayNameValue = name ?? username ?? 'Usuario';
    const roleLabels = Array.isArray(user.roles)
      ? user.roles
          .map((role) => resolveRoleLabel(role))
          .filter((label): label is string => Boolean(label && label.trim()))
      : [];

    const resolvedRoleLabel =
      roleLabels.length > 0 ? roleLabels.join(' • ') : resolveRoleLabel(user.role);

    const roleLabelValue = resolvedRoleLabel && resolvedRoleLabel.trim()
      ? resolvedRoleLabel.toUpperCase()
      : '';

    return { displayName: displayNameValue, roleLabel: roleLabelValue };
  }, [user]);

  const handleLogout = useCallback(() => {
    void Promise.resolve(logout()).catch((error) => {
      console.error('Error al cerrar sesión', error);
    });
  }, [logout]);

  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600"
          onClick={() => onToggleSidebar?.()}
          aria-label="Abrir menú"
        >
          <span className="sr-only">Abrir menú</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <div className="font-semibold text-sm sm:text-base">Unidad Educativa Adventista Los Andes</div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">{displayName}</span>
            {roleLabel && (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                {roleLabel}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
