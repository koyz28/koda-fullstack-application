import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse, LoginCredentials, RegisterPayload, User } from './auth.models';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly storage = inject(TokenStorage);

  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: LoginCredentials): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(map((response) => this.startSession(response)));
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(map((response) => this.startSession(response)));
  }

  /**
   * Revokes the token server-side; the local session is cleared even if the request fails.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {}).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  /**
   * Re-hydrates the current user from a persisted token (used at application start-up).
   */
  restoreSession(): Observable<User | null> {
    if (!this.storage.get()) {
      return of(null);
    }

    return this.http.get<{ data: User }>(`${this.baseUrl}/auth/me`).pipe(
      map((response) => response.data),
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  clearSession(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  private startSession(response: AuthResponse): User {
    this.storage.set(response.token);
    this.currentUser.set(response.user);
    return response.user;
  }
}
