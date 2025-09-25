import { useAuth } from '@/app/hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between">
      <div className="font-semibold">Unidad Educativa Adventista Los Andes</div>
      <div className="flex items-center gap-3">
        {user && <span className="text-sm text-gray-600">{user.name} • {user.role}</span>}
        <button onClick={logout} className="text-sm px-3 py-1 rounded bg-gray-900 text-white">
          Salir
        </button>
      </div>
    </header>
  );
}
