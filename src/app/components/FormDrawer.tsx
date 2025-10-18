import { useEffect } from 'react';
import type { ReactNode } from 'react';

type FormDrawerProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  error?: string | null;
  widthClassName?: string;
};

export default function FormDrawer({
  title,
  isOpen,
  onClose,
  children,
  error,
  widthClassName = 'max-w-xl',
}: FormDrawerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50" role="dialog" aria-modal="true">
      <div className={`h-full w-full bg-white shadow-xl overflow-y-auto ${widthClassName}`.trim()}>
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

