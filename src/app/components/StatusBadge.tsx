import { resolveStatus, type StatusLike } from '@/app/utils/status';

interface StatusBadgeProps extends StatusLike {
  className?: string;
}

const baseClassName =
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide';

export function StatusBadge({ estado, activo, className }: StatusBadgeProps) {
  const status = resolveStatus({ estado, activo });

  if (!status.label) {
    return null;
  }

  const colorClassName =
    status.isActive === false
      ? 'bg-red-100 text-red-800'
      : status.isActive === true
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';

  return <span className={[baseClassName, colorClassName, className].filter(Boolean).join(' ')}>{status.label}</span>;
}

export default StatusBadge;
