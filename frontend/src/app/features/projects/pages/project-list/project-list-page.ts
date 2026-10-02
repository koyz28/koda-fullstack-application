import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, skip } from 'rxjs';
import { extractErrorMessage } from '../../../../core/api/api-error';
import { ToastService } from '../../../../core/notifications/toast.service';
import { Paginated } from '../../../../shared/models/pagination';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { Pagination } from '../../../../shared/ui/pagination';
import { PriorityBadge } from '../../components/priority-badge';
import { StatusBadge } from '../../components/status-badge';
import {
  DEFAULT_PROJECT_QUERY,
  PRIORITY_LABELS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  Project,
  ProjectPriority,
  ProjectQuery,
  ProjectStatus,
  STATUS_LABELS,
  SortField,
  isProjectPriority,
  isProjectStatus,
  isSortParam,
} from '../../data/project.models';
import { ProjectsService } from '../../data/projects.service';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-project-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusBadge, PriorityBadge, Pagination, ConfirmDialog],
  templateUrl: './project-list-page.html',
})
export class ProjectListPage {
  private readonly projectsService = inject(ProjectsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly statuses = PROJECT_STATUSES;
  protected readonly priorities = PROJECT_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly columns: { field: SortField; label: string }[] = [
    { field: 'project_name', label: 'Project' },
    { field: 'status', label: 'Status' },
    { field: 'priority', label: 'Priority' },
    { field: 'start_date', label: 'Start' },
    { field: 'due_date', label: 'Due' },
  ];
  protected readonly today = toIsoDate(new Date());

  /** Single source of truth for what is displayed; mirrored to the URL for shareable links. */
  protected readonly query = signal<ProjectQuery>(fromQueryParams(this.route.snapshot.queryParams));
  protected readonly searchInput = signal(this.query().search);

  protected readonly projects = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.projectsService.list(params),
  });

  /** Keeps the previous page visible while the next one loads, avoiding layout flicker. */
  protected readonly page = linkedSignal<
    Paginated<Project> | undefined,
    Paginated<Project> | undefined
  >({
    source: () => (this.projects.hasValue() ? this.projects.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });

  protected readonly hasActiveFilters = computed(() => {
    const { search, status, priority } = this.query();
    return search.trim() !== '' || status !== null || priority !== null;
  });

  protected readonly pendingDelete = signal<Project | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    toObservable(this.searchInput)
      .pipe(skip(1), debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.patchQuery({ search }));

    effect(() => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: toQueryParams(this.query()),
        replaceUrl: true,
      });
    });
  }

  protected onSearch(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.patchQuery({ status: isProjectStatus(value) ? value : null });
  }

  protected onPriorityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.patchQuery({ priority: isProjectPriority(value) ? value : null });
  }

  protected clearFilters(): void {
    this.searchInput.set('');
    this.query.update((query) => ({ ...query, search: '', status: null, priority: null, page: 1 }));
  }

  protected toggleSort(field: SortField): void {
    const current = this.query().sort;
    this.query.update((query) => ({ ...query, sort: current === field ? `-${field}` : field }));
  }

  protected sortDirection(field: SortField): 'ascending' | 'descending' | 'none' {
    const sort = this.query().sort;
    if (sort === field) return 'ascending';
    if (sort === `-${field}`) return 'descending';
    return 'none';
  }

  protected goToPage(page: number): void {
    this.query.update((query) => ({ ...query, page }));
  }

  protected isOverdue(project: Project): boolean {
    return (
      project.status !== 'completed' && project.due_date !== null && project.due_date < this.today
    );
  }

  protected confirmDelete(): void {
    const project = this.pendingDelete();
    if (!project) return;

    this.deleting.set(true);
    this.projectsService
      .delete(project.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.pendingDelete.set(null);
          this.toast.success(`"${project.project_name}" was deleted.`);

          // Step back a page when the last item on a non-first page is removed.
          const current = this.page();
          if (current && current.data.length === 1 && current.meta.current_page > 1) {
            this.goToPage(current.meta.current_page - 1);
          } else {
            this.projects.reload();
          }
        },
        error: (error: unknown) =>
          this.toast.error(extractErrorMessage(error, 'Could not delete the project.')),
      });
  }

  /** Any filter change resets pagination to the first page. */
  private patchQuery(changes: Partial<Pick<ProjectQuery, 'search' | 'status' | 'priority'>>): void {
    this.query.update((query) => ({ ...query, ...changes, page: 1 }));
  }
}

function fromQueryParams(params: Params): ProjectQuery {
  const page = Number(params['page']);

  return {
    ...DEFAULT_PROJECT_QUERY,
    search: typeof params['search'] === 'string' ? params['search'] : '',
    status: isProjectStatus(params['status']) ? (params['status'] as ProjectStatus) : null,
    priority: isProjectPriority(params['priority'])
      ? (params['priority'] as ProjectPriority)
      : null,
    sort: isSortParam(params['sort']) ? params['sort'] : DEFAULT_PROJECT_QUERY.sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function toQueryParams(query: ProjectQuery): Params {
  return {
    search: query.search.trim() || null,
    status: query.status,
    priority: query.priority,
    sort: query.sort === DEFAULT_PROJECT_QUERY.sort ? null : query.sort,
    page: query.page > 1 ? query.page : null,
  };
}

function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
