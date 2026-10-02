import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PaginationMeta } from '../models/pagination';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let page = meta();
    <nav
      class="flex items-center justify-between gap-4 text-sm text-slate-600"
      aria-label="Pagination"
    >
      <p>
        @if (page.total > 0) {
          Showing <span class="font-medium text-slate-900">{{ page.from }}</span
          >–<span class="font-medium text-slate-900">{{ page.to }}</span> of
          <span class="font-medium text-slate-900">{{ page.total }}</span>
        }
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="page.current_page <= 1"
          (click)="pageChange.emit(page.current_page - 1)"
        >
          Previous
        </button>
        <span>Page {{ page.current_page }} of {{ page.last_page }}</span>
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="page.current_page >= page.last_page"
          (click)="pageChange.emit(page.current_page + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  readonly meta = input.required<PaginationMeta>();
  readonly pageChange = output<number>();
}
