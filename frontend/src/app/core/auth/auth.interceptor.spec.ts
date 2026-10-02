import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let storage: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
    storage.clear();
  });

  afterEach(() => {
    controller.verify();
    storage.clear();
  });

  it('adds the bearer token and JSON accept header to API requests', () => {
    storage.set('abc123');

    http.get('/api/projects').subscribe();

    const req = controller.expectOne('/api/projects');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({});
  });

  it('does not leak the token to third-party URLs', () => {
    storage.set('abc123');

    http.get('https://example.com/data').subscribe();

    const req = controller.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('clears the session and redirects to login when an authenticated request returns 401', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Establish a session.
    auth.login({ email: 'a@b.c', password: 'secret' }).subscribe();
    controller
      .expectOne('/api/auth/login')
      .flush({ token: 'abc123', token_type: 'Bearer', user: { id: 1, name: 'A', email: 'a@b.c' } });
    expect(auth.isAuthenticated()).toBe(true);

    http.get('/api/projects').subscribe({ error: () => undefined });
    controller
      .expectOne('/api/projects')
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.get()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });
});
