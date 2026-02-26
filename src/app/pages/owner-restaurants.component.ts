import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantsService } from '../lib/restaurants.service';
import { Restaurant } from '../lib/types';
import { TenantService } from '../lib/tenant.service';
import { ToastService } from '../ui/toast.service';

type RestaurantForm = {
  name: string;
  slug: string;
  isActive: boolean;
};

@Component({
  selector: 'app-owner-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-white">Negocios</h1>
          <p class="text-sm text-slate-400">{{ restaurants.length }} registrados</p>
        </div>
        <button
          *ngIf="!adding"
          (click)="startAdd()"
          class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          + Crear negocio
        </button>
      </div>

      <div *ngIf="adding || editingId" class="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
        <div class="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-widest text-slate-400">Nombre</label>
            <input
              [(ngModel)]="form.name"
              name="name"
              (ngModelChange)="handleNameChange($event)"
              class="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="Restaurante Central"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-widest text-slate-400">Slug</label>
            <input
              [(ngModel)]="form.slug"
              name="slug"
              (ngModelChange)="slugTouched = true"
              class="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="restaurante-central"
            />
          </div>
          <div class="flex items-end gap-2">
            <label class="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              Activo
            </label>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button
            (click)="save()"
            class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Guardar
          </button>
          <button
            (click)="cancel()"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
          >
            Cancelar
          </button>
        </div>
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
            <div class="text-xs text-slate-500">URL: {{ getRestaurantUrl(restaurant.slug) }}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              (click)="setActive(restaurant)"
              class="rounded-lg px-3 py-2 text-xs font-semibold"
              [ngClass]="
                activeRestaurantId === restaurant.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-200'
              "
              [disabled]="activeRestaurantId === restaurant.id"
            >
              Usar
            </button>
            <a
              [routerLink]="['/owner/restaurants', restaurant.id, 'history']"
              class="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-200"
            >
              Historial
            </a>
            <a
              [href]="getRestaurantUrl(restaurant.slug)"
              class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
            >
              Abrir App
            </a>
            <button
              (click)="toggleStatus(restaurant)"
              class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
            >
              {{ restaurant.isActive ? 'Desactivar' : 'Activar' }}
            </button>
            <button
              (click)="startEdit(restaurant)"
              class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
            >
              Editar
            </button>
            <button
              (click)="handleDelete(restaurant)"
              class="rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-semibold text-rose-300 hover:border-rose-400 hover:text-rose-200"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRestaurantsComponent {
  restaurants: Restaurant[] = [];
  loading = true;
  adding = false;
  editingId: string | null = null;
  slugTouched = false;
  form: RestaurantForm = { name: '', slug: '', isActive: true };

  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly toast: ToastService,
    private readonly tenant: TenantService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    void this.load();
  }

  get activeRestaurantId(): string | null {
    return this.tenant.activeRestaurantId();
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

  startAdd(): void {
    this.adding = true;
    this.editingId = null;
    this.slugTouched = false;
    this.form = { name: '', slug: '', isActive: true };
  }

  startEdit(restaurant: Restaurant): void {
    this.editingId = restaurant.id;
    this.adding = false;
    this.slugTouched = true;
    this.form = {
      name: restaurant.name,
      slug: restaurant.slug,
      isActive: restaurant.isActive,
    };
  }

  handleNameChange(value: string): void {
    if (!this.slugTouched) {
      this.form.slug = this.slugify(value);
    }
  }

  async save(): Promise<void> {
    if (!this.form.name.trim()) {
      this.toast.error('El nombre es obligatorio');
      return;
    }
    const payload = {
      name: this.form.name.trim(),
      slug: (this.form.slug || this.slugify(this.form.name)).trim(),
      isActive: this.form.isActive,
    };
    try {
      if (this.editingId) {
        await firstValueFrom(
          this.restaurantsService.update(this.editingId, {
            name: payload.name,
            slug: payload.slug,
            isActive: payload.isActive,
          }),
        );
        this.toast.success('Negocio actualizado');
      } else {
        const created = await firstValueFrom(
          this.restaurantsService.create({ name: payload.name, slug: payload.slug }),
        );
        this.tenant.setActiveRestaurant(created.id, created.name);
        this.toast.success('Negocio creado');
      }
      await this.load();
      this.cancel();
    } catch {
      this.toast.error('No se pudo guardar el negocio');
    }
  }

  cancel(): void {
    this.adding = false;
    this.editingId = null;
    this.slugTouched = false;
    this.form = { name: '', slug: '', isActive: true };
  }

  async toggleStatus(restaurant: Restaurant): Promise<void> {
    try {
      await firstValueFrom(
        this.restaurantsService.update(restaurant.id, { isActive: !restaurant.isActive }),
      );
      this.toast.success('Estado actualizado');
      await this.load();
    } catch {
      this.toast.error('No se pudo actualizar el estado');
    }
  }

  async handleDelete(restaurant: Restaurant): Promise<void> {
    const confirmed = window.confirm(`Eliminar "${restaurant.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.restaurantsService.remove(restaurant.id));
      this.toast.success('Negocio eliminado');
      await this.load();
    } catch {
      this.toast.error('No se pudo eliminar el negocio');
    }
  }

  setActive(restaurant: Restaurant): void {
    this.tenant.setActiveRestaurant(restaurant.id, restaurant.name);
    this.toast.success(`Negocio activo: ${restaurant.name}`);
  }

  getRestaurantUrl(slug: string): string {
    if (typeof window === 'undefined') {
      return `/r/${slug}`;
    }
    return `${window.location.origin}/r/${slug}`;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
