import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps in-app relative paths', () => {
    expect(safeReturnUrl('/projects/3/edit')).toBe('/projects/3/edit');
  });

  it.each([undefined, null, '', 'https://evil.example', '//evil.example', '/\\evil.example'])(
    'falls back for unsafe value %s',
    (url) => {
      expect(safeReturnUrl(url)).toBe('/projects');
    },
  );
});
