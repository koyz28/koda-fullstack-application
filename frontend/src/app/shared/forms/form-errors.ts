import { AbstractControl } from '@angular/forms';
import { ValidationErrors as ApiValidationErrors } from '../../core/api/api-error';

/**
 * Attaches server-side (Laravel 422) errors to matching form controls as `{ server: message }`.
 * Returns true when at least one error could be mapped to a control.
 */
export function applyServerErrors(form: AbstractControl, errors: ApiValidationErrors): boolean {
  let applied = false;

  for (const [field, messages] of Object.entries(errors)) {
    const control = form.get(field);
    if (control && messages.length > 0) {
      control.setErrors({ ...control.errors, server: messages[0] });
      control.markAsTouched();
      applied = true;
    }
  }

  return applied;
}

/**
 * Returns the first human-readable error for a control, or null when it is valid/untouched.
 */
export function controlError(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return null;
  }

  const errors = control.errors;

  if (errors['server']) return errors['server'] as string;
  if (errors['required']) return `${label} is required.`;
  if (errors['email']) return 'Please enter a valid email address.';
  if (errors['maxlength']) {
    return `${label} may not be longer than ${errors['maxlength'].requiredLength} characters.`;
  }
  if (errors['minlength']) {
    return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
  }

  return `${label} is invalid.`;
}
