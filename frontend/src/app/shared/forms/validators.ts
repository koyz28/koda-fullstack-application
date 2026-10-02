import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Like Validators.required, but also rejects whitespace-only strings.
 */
export const requiredTrimmed: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return typeof value === 'string' && value.trim() === '' ? { required: true } : null;
};

/**
 * Group validator ensuring `endKey` is not earlier than `startKey` (ISO `YYYY-MM-DD` strings).
 * The error is placed on the group as `{ dateRange: true }`.
 */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as string | null | undefined;
    const end = group.get(endKey)?.value as string | null | undefined;

    if (!start || !end) {
      return null;
    }

    // ISO dates compare correctly as strings.
    return end < start ? { dateRange: true } : null;
  };
}
