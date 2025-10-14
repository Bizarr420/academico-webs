import { useEffect, useState } from 'react';

import FormDrawer from '@/app/components/FormDrawer';
import type { Alert, AlertStatus } from '@/app/types';
import { ALERT_STATUS_CODES, ALERT_STATUS_LABELS } from '@/app/types';

type AlertStatusDialogProps = {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (status: AlertStatus, comment: string) => void;
};

export default function AlertStatusDialog({ alert, open, onClose, onSubmit }: AlertStatusDialogProps) {
  const [status, setStatus] = useState<AlertStatus>('EN_PROCESO');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open && alert) {
      setStatus(alert.estado);
      setComment(alert.observacion ?? alert.comentario ?? '');
    }
  }, [alert, open]);

  if (!alert) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit(status, comment);
  };

  return (
    <FormDrawer
      title={`Actualizar estado · ${alert.estudiante}`}
      isOpen={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Guardar"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600" htmlFor="alert-status-select">
            Nuevo estado
          </label>
          <select
            id="alert-status-select"
            className="border rounded px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as AlertStatus)}
          >
            {ALERT_STATUS_CODES.map((code) => (
              <option key={code} value={code}>
                {ALERT_STATUS_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600" htmlFor="alert-status-comment">
            Observación
          </label>
          <textarea
            id="alert-status-comment"
            className="border rounded px-3 py-2"
            rows={4}
            placeholder="Describe las acciones tomadas…"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
      </div>
    </FormDrawer>
  );
}

