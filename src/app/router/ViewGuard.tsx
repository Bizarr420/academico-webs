import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/hooks/useAuth';
import type { ViewCode } from '@/app/types';

type ViewGuardProps = {
  required: ViewCode;
};

export function ViewGuard({ required }: ViewGuardProps) {
  const { hasView } = useAuth();

  if (!hasView(required)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
