import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { extractErrorMessage, extractValidationErrors } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { applyServerErrors, controlError } from '../../shared/forms/form-errors';
import { requiredTrimmed } from '../../shared/forms/validators';

type Field = 'name' | 'email' | 'password' | 'password_confirmation';

const LABELS: Record<Field, string> = {
  name: 'Name',
  email: 'Email',
  password: 'Password',
  password_confirmation: 'Password confirmation',
};

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-semibold text-slate-900">Create an account</h1>
          <p class="mt-1 text-sm text-slate-500">Start tracking your client projects</p>
        </div>

        <form class="card space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (formError(); as message) {
            <div class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {{ message }}
            </div>
          }

          @for (field of fields; track field.name) {
            <div>
              <label [for]="field.name" class="label">{{ field.label }}</label>
              <input
                [id]="field.name"
                [type]="field.type"
                [attr.autocomplete]="field.autocomplete"
                class="input"
                [formControlName]="field.name"
                [class.input-invalid]="error(field.name)"
              />
              @if (error(field.name); as message) {
                <p class="field-error">{{ message }}</p>
              }
            </div>
          }

          <button type="submit" class="btn btn-primary w-full" [disabled]="submitting()">
            {{ submitting() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="text-center text-sm text-slate-600">
          Already registered? <a routerLink="/login" class="btn-link">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly fields: { name: Field; label: string; type: string; autocomplete: string }[] =
    [
      { name: 'name', label: LABELS.name, type: 'text', autocomplete: 'name' },
      { name: 'email', label: LABELS.email, type: 'email', autocomplete: 'email' },
      { name: 'password', label: LABELS.password, type: 'password', autocomplete: 'new-password' },
      {
        name: 'password_confirmation',
        label: 'Confirm password',
        type: 'password',
        autocomplete: 'new-password',
      },
    ];

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, requiredTrimmed, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected error(field: Field): string | null {
    const control = this.form.controls[field];
    if (
      field === 'password_confirmation' &&
      control.touched &&
      control.value !== '' &&
      control.value !== this.form.controls.password.value
    ) {
      return 'Passwords do not match.';
    }
    return controlError(control, LABELS[field]);
  }

  protected submit(): void {
    this.formError.set(null);
    const { password, password_confirmation } = this.form.getRawValue();

    if (this.form.invalid || password !== password_confirmation) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.auth
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/projects'),
        error: (error: unknown) => {
          if (!applyServerErrors(this.form, extractValidationErrors(error))) {
            this.formError.set(extractErrorMessage(error, 'Unable to create your account.'));
          }
        },
      });
  }
}
