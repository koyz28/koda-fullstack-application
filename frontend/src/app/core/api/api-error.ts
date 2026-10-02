import { HttpErrorResponse } from '@angular/common/http';

export type ValidationErrors = Record<string, string[]>;

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Extracts a user-facing message from an API error (Laravel returns `{ message }`).
 */
export function extractErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection.';
  }

  const message = (error.error as { message?: unknown } | null)?.message;

  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
}

/**
 * Returns Laravel's field-level validation errors for a 422 response, or an empty object.
 */
export function extractValidationErrors(error: unknown): ValidationErrors {
  if (!(error instanceof HttpErrorResponse) || error.status !== 422) {
    return {};
  }

  const errors = (error.error as { errors?: unknown } | null)?.errors;

  return errors && typeof errors === 'object' ? (errors as ValidationErrors) : {};
}
