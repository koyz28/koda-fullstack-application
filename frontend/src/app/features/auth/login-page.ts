import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { extractErrorMessage, extractValidationErrors } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { applyServerErrors, controlError } from '../../shared/forms/form-errors';
import { safeReturnUrl } from './return-url';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p class="mt-1 text-sm text-slate-500">to the Client Project Tracker</p>
        </div>

        <form class="card space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (formError(); as message) {
            <div class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {{ message }}
            </div>
          }

          <div>
            <label for="email" class="label">Email</label>
            <input
              id="email"
              type="email"
              autocomplete="email"
              class="input"
              formControlName="email"
              [class.input-invalid]="error('email', 'Email')"
            />
            @if (error('email', 'Email'); as message) {
              <p class="field-error">{{ message }}</p>
            }
          </div>

          <div>
            <label for="password" class="label">Password</label>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              class="input"
              formControlName="password"
              [class.input-invalid]="error('password', 'Password')"
            />
            @if (error('password', 'Password'); as message) {
              <p class="field-error">{{ message }}</p>
            }
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="submitting()">
            {{ submitting() ? 'Signing in…' : 'Sign in' }}
          </button>

          <p class="text-center text-xs text-slate-500">
            Demo account: <code>demo&#64;example.com</code> / <code>password</code>
          </p>
        </form>

        <p class="text-center text-sm text-slate-600">
          No account? <a routerLink="/register" class="btn-link">Create one</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected error(field: 'email' | 'password', label: string): string | null {
    return controlError(this.form.controls[field], label);
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
        error: (error: unknown) => {
          if (!applyServerErrors(this.form, extractValidationErrors(error))) {
            this.formError.set(extractErrorMessage(error, 'Unable to sign in.'));
          }
        },
      });
  }
}
