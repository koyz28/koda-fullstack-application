import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { extractErrorMessage, extractValidationErrors } from '../../../../core/api/api-error';
import { ToastService } from '../../../../core/notifications/toast.service';
import { applyServerErrors, controlError } from '../../../../shared/forms/form-errors';
import { dateRangeValidator, requiredTrimmed } from '../../../../shared/forms/validators';
import {
  PRIORITY_LABELS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  Project,
  ProjectPayload,
  ProjectPriority,
  ProjectStatus,
  STATUS_LABELS,
} from '../../data/project.models';
import { ProjectsService } from '../../data/projects.service';

type FieldName =
  | 'client_name'
  | 'project_name'
  | 'description'
  | 'status'
  | 'priority'
  | 'start_date'
  | 'due_date';

const FIELD_LABELS: Record<FieldName, string> = {
  client_name: 'Client name',
  project_name: 'Project name',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  start_date: 'Start date',
  due_date: 'Due date',
};

/**
 * Handles both "create" (/projects/new) and "edit" (/projects/:id/edit).
 */
@Component({
  selector: 'app-project-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-form-page.html',
})
export class ProjectFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly projectsService = inject(ProjectsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Bound from the `:id` route parameter (withComponentInputBinding). */
  readonly id = input<string>();

  protected readonly projectId = computed(() => {
    const id = Number(this.id());
    return Number.isInteger(id) && id > 0 ? id : undefined;
  });
  protected readonly isEdit = computed(() => this.id() !== undefined);

  protected readonly statuses = PROJECT_STATUSES;
  protected readonly priorities = PROJECT_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly form = this.fb.group(
    {
      client_name: ['', [Validators.required, requiredTrimmed, Validators.maxLength(255)]],
      project_name: ['', [Validators.required, requiredTrimmed, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(5000)]],
      status: ['planning' as ProjectStatus, [Validators.required]],
      priority: ['medium' as ProjectPriority, [Validators.required]],
      start_date: [todayIso(), [Validators.required]],
      due_date: [''],
    },
    { validators: dateRangeValidator('start_date', 'due_date') },
  );

  protected readonly existing = rxResource({
    params: () => this.projectId(),
    stream: ({ params: id }) => this.projectsService.get(id),
  });

  protected readonly notFound = computed(() => {
    if (this.isEdit() && this.projectId() === undefined) return true;
    const error = this.existing.error();
    return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 403);
  });

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.existing.hasValue()) {
        this.populate(this.existing.value());
      }
    });
  }

  protected error(field: FieldName): string | null {
    return controlError(this.form.controls[field], FIELD_LABELS[field]);
  }

  protected dateRangeError(): boolean {
    const due = this.form.controls.due_date;
    return this.form.hasError('dateRange') && (due.touched || due.dirty);
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();
    const id = this.projectId();
    const request$ = id
      ? this.projectsService.update(id, payload)
      : this.projectsService.create(payload);

    this.saving.set(true);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (project) => {
        this.form.markAsPristine();
        this.toast.success(`"${project.project_name}" was ${id ? 'updated' : 'created'}.`);
        void this.router.navigate(['/projects']);
      },
      error: (error: unknown) => {
        const mapped = applyServerErrors(this.form, extractValidationErrors(error));
        this.formError.set(
          mapped
            ? 'Please correct the highlighted fields.'
            : extractErrorMessage(error, 'Could not save the project.'),
        );
      },
    });
  }

  private populate(project: Project): void {
    this.form.reset({
      client_name: project.client_name,
      project_name: project.project_name,
      description: project.description ?? '',
      status: project.status,
      priority: project.priority,
      start_date: project.start_date,
      due_date: project.due_date ?? '',
    });
  }

  private toPayload(): ProjectPayload {
    const value = this.form.getRawValue();
    const description = value.description.trim();

    return {
      client_name: value.client_name.trim(),
      project_name: value.project_name.trim(),
      description: description === '' ? null : description,
      status: value.status,
      priority: value.priority,
      start_date: value.start_date,
      due_date: value.due_date === '' ? null : value.due_date,
    };
  }
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
