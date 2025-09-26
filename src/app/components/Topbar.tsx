import { useAuth } from '@/app/hooks/useAuth';

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();

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
        {user && <span className="text-xs sm:text-sm text-gray-600">{user.name} • {user.role}</span>}
        <button
          onClick={logout}
          className="text-sm px-3 py-1 rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
