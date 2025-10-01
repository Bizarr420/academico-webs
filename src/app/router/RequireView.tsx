import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';
import type { ViewCode } from '@/app/types';

type RequireViewProps = {
  code: ViewCode | ViewCode[];
  children: ReactNode;
};

const ensureArray = (code: ViewCode | ViewCode[]): ViewCode[] => (Array.isArray(code) ? code : [code]);

export function RequireView({ code, children }: RequireViewProps) {
  const { hasView, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-gray-600">
        Verificando permisos…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const requiredCodes = ensureArray(code);
  const allowed = requiredCodes.some((item) => hasView(item));

  if (!allowed) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
