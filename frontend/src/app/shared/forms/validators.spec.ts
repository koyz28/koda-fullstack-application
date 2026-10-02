import { FormControl, FormGroup } from '@angular/forms';
import { dateRangeValidator, requiredTrimmed } from './validators';

describe('requiredTrimmed', () => {
  it('rejects whitespace-only strings', () => {
    expect(requiredTrimmed(new FormControl('   '))).toEqual({ required: true });
  });

  it('accepts non-blank strings', () => {
    expect(requiredTrimmed(new FormControl(' Acme '))).toBeNull();
  });
});

describe('dateRangeValidator', () => {
  const build = (start: string, end: string) =>
    new FormGroup(
      { start: new FormControl(start), end: new FormControl(end) },
      { validators: dateRangeValidator('start', 'end') },
    );

  it('flags an end date earlier than the start date', () => {
    expect(build('2026-10-10', '2026-10-09').errors).toEqual({ dateRange: true });
  });

  it('allows equal or later end dates', () => {
    expect(build('2026-10-10', '2026-10-10').errors).toBeNull();
    expect(build('2026-10-10', '2027-01-01').errors).toBeNull();
  });

  it('ignores the rule when either date is empty', () => {
    expect(build('2026-10-10', '').errors).toBeNull();
    expect(build('', '2026-10-10').errors).toBeNull();
  });
});
