/**
 * Mirrors the backend enums (App\Enums\ProjectStatus / ProjectPriority).
 * Order matters: it is the order used in dropdowns.
 */
export const PROJECT_STATUSES = ['planning', 'in_progress', 'on_hold', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIORITIES = ['low', 'medium', 'high'] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
};

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export interface Project {
  id: number;
  client_name: string;
  project_name: string;
  description: string | null;
  status: ProjectStatus;
  status_label: string;
  priority: ProjectPriority;
  priority_label: string;
  start_date: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  client_name: string;
  project_name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  due_date: string | null;
}

export const SORTABLE_FIELDS = [
  'client_name',
  'project_name',
  'status',
  'priority',
  'start_date',
  'due_date',
  'created_at',
] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];
/** A leading "-" means descending, matching the API's `sort` parameter. */
export type SortParam = SortField | `-${SortField}`;

export const DEFAULT_SORT: SortParam = '-created_at';

export interface ProjectQuery {
  search: string;
  status: ProjectStatus | null;
  priority: ProjectPriority | null;
  sort: SortParam;
  page: number;
  perPage: number;
}

export const DEFAULT_PROJECT_QUERY: ProjectQuery = {
  search: '',
  status: null,
  priority: null,
  sort: DEFAULT_SORT,
  page: 1,
  perPage: 10,
};

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

export function isProjectPriority(value: unknown): value is ProjectPriority {
  return PROJECT_PRIORITIES.includes(value as ProjectPriority);
}

export function isSortParam(value: unknown): value is SortParam {
  return (
    typeof value === 'string' && SORTABLE_FIELDS.includes(value.replace(/^-/, '') as SortField)
  );
}
