import type { Paginated, PaginatedResponse } from '@/app/types';

type PossiblePaginated<T> = Partial<Paginated<T>> & {
  results?: T[];
  data?: T[];
  count?: number;
  current_page?: number;
  per_page?: number;
};

const toNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const pickItems = <T>(data: PossiblePaginated<T>): T[] => {
  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

export function normalizePaginatedResponse<T>(data: PaginatedResponse<T>): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      page_size: data.length,
    };
  }

  const possible = data as PossiblePaginated<T>;
  const items = pickItems(possible);

  const total = toNumber(
    possible.total ?? possible.count ?? null,
    items.length,
  );

  const page = toNumber(possible.page ?? possible.current_page ?? null, 1);

  const pageSize = toNumber(possible.page_size ?? possible.per_page ?? null, items.length);

  return {
    items,
    total,
    page,
    page_size: pageSize,
  };
}
