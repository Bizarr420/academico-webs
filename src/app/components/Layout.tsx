import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar móvil */}
      <Sidebar
        className={`fixed inset-y-0 left-0 z-50 border-r shadow-lg transition-transform duration-200 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onNavigate={closeSidebar}
      />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar className="hidden lg:flex lg:h-screen lg:sticky lg:top-0 lg:border-r" />
        <main className="flex-1 flex flex-col min-h-screen">
          <Topbar onToggleSidebar={() => setIsSidebarOpen((current) => !current)} />
          <div className="p-4 flex-1">
            {/* Breadcrumb simple */}
            <nav className="mb-4 text-sm text-gray-500">
              <Link to="/" className="hover:underline">
                Inicio
              </Link>
              {pathname !== '/' && <span> / {pathname.replace('/', '')}</span>}
            </nav>
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
