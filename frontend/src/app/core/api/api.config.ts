import { InjectionToken } from '@angular/core';

/**
 * Base URL of the Laravel API. Relative by default so the dev-server proxy
 * (proxy.conf.json) and the production nginx config can route `/api` to the backend.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
