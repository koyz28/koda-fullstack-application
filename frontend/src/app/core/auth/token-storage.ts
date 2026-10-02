import { Injectable } from '@angular/core';

const STORAGE_KEY = 'project_tracker.token';

/**
 * Thin wrapper around localStorage so token persistence can be swapped or mocked.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  set(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
