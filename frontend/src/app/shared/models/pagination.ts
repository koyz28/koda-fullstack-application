export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Shape of a paginated Laravel API resource collection.
 */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
