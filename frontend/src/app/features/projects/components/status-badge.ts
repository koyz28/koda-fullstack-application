import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProjectStatus, STATUS_LABELS } from '../data/project.models';

const STYLES: Record<ProjectStatus, string> = {
  planning: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  on_hold: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="classes()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<ProjectStatus>();

  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly classes = computed(() => STYLES[this.status()]);
}
