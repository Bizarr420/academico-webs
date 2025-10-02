export const extractInactiveResourceId = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidates: unknown[] = [];
  const container = value as Record<string, unknown>;

  if ('id' in container) {
    candidates.push(container.id);
  }
  if ('resource_id' in container) {
    candidates.push(container.resource_id);
  }
  if ('registro_id' in container) {
    candidates.push(container.registro_id);
  }

  if ('detail' in container) {
    const detail = container.detail;
    if (typeof detail === 'object' && detail) {
      const detailRecord = detail as Record<string, unknown>;
      if ('id' in detailRecord) {
        candidates.push(detailRecord.id);
      }
      if ('resource_id' in detailRecord) {
        candidates.push(detailRecord.resource_id);
      }
      if ('registro_id' in detailRecord) {
        candidates.push(detailRecord.registro_id);
      }
    }
  }

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};
