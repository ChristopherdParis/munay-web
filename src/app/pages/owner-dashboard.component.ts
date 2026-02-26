import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantsService } from '../lib/restaurants.service';
import { Restaurant } from '../lib/types';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="space-y-6">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Negocios</div>
          <div class="mt-2 text-3xl font-semibold text-white">{{ restaurants.length }}</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Activos</div>
          <div class="mt-2 text-3xl font-semibold text-emerald-300">{{ activeCount }}</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Inactivos</div>
          <div class="mt-2 text-3xl font-semibold text-rose-300">{{ inactiveCount }}</div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-white">Monitoreo de negocios</h2>
            <p class="text-sm text-slate-400">Estado actual y accesos rapidos</p>
          </div>
          <a
            routerLink="/owner/restaurants"
            class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
          >
            Gestionar
          </a>
        </div>

        <div *ngIf="loading" class="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
          Cargando negocios...
        </div>

        <div *ngIf="!loading && restaurants.length === 0" class="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
          No hay negocios registrados.
        </div>

        <div *ngIf="!loading && restaurants.length" class="space-y-3">
          <div
            *ngFor="let restaurant of restaurants"
            class="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-white">{{ restaurant.name }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  [ngClass]="restaurant.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'"
                >
                  {{ restaurant.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="text-xs text-slate-400">Slug: {{ restaurant.slug }}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <a
                [routerLink]="['/owner/restaurants', restaurant.id, 'history']"
                class="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-emerald-500/20 hover:text-emerald-200"
              >
                Ver historial
              </a>
              <a
                [href]="getRestaurantUrl(restaurant.slug)"
                class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
              >
                Abrir App
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class OwnerDashboardComponent {
  restaurants: Restaurant[] = [];
  loading = true;

  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    void this.load();
  }

  get activeCount(): number {
    return this.restaurants.filter((r) => r.isActive).length;
  }

  get inactiveCount(): number {
    return this.restaurants.filter((r) => !r.isActive).length;
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const result = await firstValueFrom(this.restaurantsService.list());
      this.restaurants = Array.isArray(result) ? result : [];
    } catch {
      this.toast.error('No se pudieron cargar los negocios');
      this.restaurants = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  getRestaurantUrl(slug: string): string {
    if (typeof window === 'undefined') {
      return `/r/${slug}`;
    }
    return `${window.location.origin}/r/${slug}`;
  }
}
