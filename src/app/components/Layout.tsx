import { Link, Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Topbar />
          <div className="p-4">
            {/* Breadcrumb simple */}
            <nav className="mb-4 text-sm text-gray-500">
              <Link to="/" className="hover:underline">
                Inicio
              </Link>
              {pathname !== '/' && <span> / {pathname.replace('/', '')}</span>}
            </nav>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
