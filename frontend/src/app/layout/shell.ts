import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Authenticated application chrome: top navigation + routed content.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a routerLink="/projects" class="flex items-center gap-2 font-semibold text-slate-900">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm text-white"
            >PT</span
          >
          Project Tracker
        </a>
        <div class="flex items-center gap-4 text-sm">
          <span class="hidden text-slate-600 sm:inline">{{ auth.user()?.name }}</span>
          <button type="button" class="btn btn-secondary" (click)="logout()">Sign out</button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <router-outlet />
    </main>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout().subscribe({ complete: () => void this.router.navigate(['/login']) });
  }
}
