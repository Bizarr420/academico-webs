import type { ReactNode } from 'react';

type SortDirection = 'asc' | 'desc';

export type DataTableColumn<TItem> = {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
  render?: (item: TItem) => ReactNode;
  accessor?: keyof TItem;
};

type DataTableProps<TItem> = {
  columns: DataTableColumn<TItem>[];
  data: TItem[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  sortBy?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  filters?: ReactNode;
  header?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
};

const alignClassName: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const resolveValue = <TItem,>(item: TItem, column: DataTableColumn<TItem>) => {
  if (column.render) {
    return column.render(item);
  }

  if (column.accessor) {
    const record = item as Record<string, unknown>;
    const value = record[String(column.accessor)];
    if (value === null || value === undefined) {
      return '—';
    }
    return String(value);
  }

  return null;
};

const formatSummary = (page: number, pageSize: number, total: number, itemsLength: number) => {
  if (total === 0) {
    return 'Sin resultados';
  }

  const start = (page - 1) * pageSize + 1;
  const end = start + itemsLength - 1;
  return `Mostrando ${start}-${end} de ${total}`;
};

export default function DataTable<TItem>({
  columns,
  data,
  page,
  total,
  pageSize,
  onPageChange,
  sortBy,
  sortDirection,
  onSortChange,
  isLoading = false,
  isFetching = false,
  error,
  filters,
  header,
  actions,
  footer,
  emptyMessage = 'No hay datos para mostrar.',
  loadingMessage = 'Cargando información…',
}: DataTableProps<TItem>) {
  const handleSort = (column: DataTableColumn<TItem>) => {
    if (!column.sortable || !onSortChange) {
      return;
    }

    const isSameColumn = sortBy === column.key;
    const nextDirection: SortDirection = !isSameColumn
      ? 'asc'
      : sortDirection === 'asc'
      ? 'desc'
      : 'asc';
    onSortChange(column.key, nextDirection);
  };

  const showEmpty = !isLoading && !error && data.length === 0;
  const canGoPrevious = page > 1 && !isLoading && !isFetching;
  const canGoNext = page * pageSize < total && !isLoading && !isFetching;

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          {header}
          {filters && <div className="mt-3">{filters}</div>}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500">{loadingMessage}</div>
      ) : showEmpty ? (
        <div className="py-6 text-center text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                {columns.map((column) => {
                  const isSorted = sortBy === column.key;
                  const direction = isSorted ? sortDirection : null;
                  return (
                    <th
                      key={column.key}
                      className={`px-3 py-2 font-medium ${
                        alignClassName[column.align ?? 'left']
                      } ${column.className ?? ''}`.trim()}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      <button
                        type="button"
                        className={`flex items-center gap-1 ${
                          column.sortable ? 'hover:text-gray-900' : ''
                        } ${isSorted ? 'text-gray-900' : ''}`.trim()}
                        onClick={() => handleSort(column)}
                        disabled={!column.sortable}
                      >
                        <span>{column.header}</span>
                        {column.sortable && (
                          <span className="text-xs text-gray-400">
                            {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3 py-2 ${alignClassName[column.align ?? 'left']} ${
                        column.className ?? ''
                      }`.trim()}
                    >
                      {resolveValue(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-500">
          {formatSummary(page, pageSize, total, data.length)}
          {isFetching && !isLoading && <span className="ml-2">Actualizando…</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={!canGoPrevious}
          >
            Anterior
          </button>
          <span>
            Página {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!canGoNext}
          >
            Siguiente
          </button>
        </div>
      </div>

      {footer && <div className="border-t pt-3 text-sm text-gray-600">{footer}</div>}
    </div>
  );
}

