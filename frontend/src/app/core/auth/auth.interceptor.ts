import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

/**
 * Adds JSON + Bearer headers to API calls and ends the session when the token expires.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);

  if (!request.url.startsWith(baseUrl)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = inject(TokenStorage).get();

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(request.clone({ setHeaders: headers })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.isAuthenticated()) {
        auth.clearSession();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }

      return throwError(() => error);
    }),
  );
};
