import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OwnerAuthService } from '../lib/owner-auth.service';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <ng-container *ngIf="auth.isAuthed(); else loginView">
        <header class="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
          <div class="container flex items-center justify-between py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <app-icon class="h-5 w-5" name="settings"></app-icon>
              </div>
              <div>
                <div class="text-xs uppercase tracking-[0.2em] text-emerald-300">Owner</div>
                <div class="text-lg font-semibold text-slate-100">Control Center</div>
              </div>
            </div>
            <nav class="flex items-center gap-2 text-sm">
              <a
                routerLink="/owner"
                routerLinkActive="active"
                class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                Overview
              </a>
              <a
                routerLink="/owner/restaurants"
                routerLinkActive="active"
                class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Negocios
              </a>
              <button
                (click)="logout()"
                class="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
              >
                Salir
              </button>
            </nav>
          </div>
        </header>
        <main class="container py-8">
          <router-outlet></router-outlet>
        </main>
      </ng-container>

      <ng-template #loginView>
        <div class="container flex min-h-screen items-center justify-center py-12">
          <div class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl">
            <div class="mb-6 text-center">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <app-icon class="h-6 w-6" name="settings"></app-icon>
              </div>
              <h1 class="text-2xl font-semibold text-white">Owner Login</h1>
              <p class="text-sm text-slate-400">Acceso exclusivo del administrador</p>
            </div>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Usuario</label>
                <input
                  [(ngModel)]="username"
                  name="username"
                  class="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  placeholder="owner"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Clave</label>
                <input
                  [(ngModel)]="password"
                  name="password"
                  type="password"
                  class="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  placeholder="********"
                />
              </div>
              <button
                (click)="handleLogin()"
                class="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Entrar
              </button>
              <p *ngIf="error" class="text-center text-xs text-rose-400">
                Credenciales incorrectas
              </p>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class OwnerLayoutComponent {
  username = '';
  password = '';
  error = false;

  constructor(readonly auth: OwnerAuthService, private readonly router: Router) {}

  handleLogin(): void {
    const ok = this.auth.login(this.username, this.password);
    this.error = !ok;
    if (ok) {
      this.router.navigate(['/owner']);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/owner']);
  }
}
