import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40" aria-hidden="true" (click)="onEscape()"></div>
        <div
          class="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
        >
          <h2 id="confirm-dialog-title" class="text-lg font-semibold text-slate-900">
            {{ title() }}
          </h2>
          <p id="confirm-dialog-message" class="mt-2 text-sm text-slate-600">{{ message() }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="busy()"
              (click)="cancelled.emit()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              [disabled]="busy()"
              (click)="confirmed.emit()"
            >
              {{ busy() ? 'Working…' : confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('Are you sure?');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected onEscape(): void {
    if (this.open() && !this.busy()) {
      this.cancelled.emit();
    }
  }
}
