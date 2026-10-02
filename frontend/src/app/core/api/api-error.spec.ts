import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage, extractValidationErrors } from './api-error';

describe('api-error helpers', () => {
  it('uses the API message when present', () => {
    const error = new HttpErrorResponse({ status: 404, error: { message: 'Project not found.' } });
    expect(extractErrorMessage(error)).toBe('Project not found.');
  });

  it('explains network failures', () => {
    expect(extractErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain(
      'Unable to reach the server',
    );
  });

  it('falls back for unknown errors', () => {
    expect(extractErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback');
  });

  it('extracts Laravel validation errors from 422 responses only', () => {
    const errors = { client_name: ['The client name field is required.'] };

    expect(
      extractValidationErrors(new HttpErrorResponse({ status: 422, error: { errors } })),
    ).toEqual(errors);
    expect(
      extractValidationErrors(new HttpErrorResponse({ status: 500, error: { errors } })),
    ).toEqual({});
  });
});
