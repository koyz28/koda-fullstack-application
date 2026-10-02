import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PRIORITY_LABELS, ProjectPriority } from '../data/project.models';

const STYLES: Record<ProjectPriority, string> = {
  low: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  medium: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  high: 'bg-red-50 text-red-700 ring-red-600/20',
};

@Component({
  selector: 'app-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="classes()">{{ label() }}</span>`,
})
export class PriorityBadge {
  readonly priority = input.required<ProjectPriority>();

  protected readonly label = computed(() => PRIORITY_LABELS[this.priority()]);
  protected readonly classes = computed(() => STYLES[this.priority()]);
}
