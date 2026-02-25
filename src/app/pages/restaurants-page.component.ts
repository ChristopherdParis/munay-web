import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RestaurantsService } from '../lib/restaurants.service';
import { Restaurant } from '../lib/types';
import { IconComponent } from '../ui/icon.component';
import { ToastService } from '../ui/toast.service';
import { TenantService } from '../lib/tenant.service';

type RestaurantForm = {
  name: string;
  slug: string;
  isActive: boolean;
};

@Component({
  selector: 'app-restaurants-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="container py-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Negocios</h1>
          <p class="text-sm text-muted-foreground">
            {{ restaurants.length }} registrados
          </p>
        </div>
        <button
          *ngIf="!adding"
          (click)="startAdd()"
          class="touch-target flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.98]"
        >
          <app-icon class="h-4 w-4" name="plus"></app-icon>
          Nuevo negocio
        </button>
      </div>

      <div *ngIf="adding || editingId" class="mb-6">
        <ng-container *ngTemplateOutlet="formRow"></ng-container>
      </div>

      <div *ngIf="loading" class="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Cargando negocios...
      </div>

      <div *ngIf="!loading && restaurants.length === 0" class="rounded-xl border bg-card p-6">
        <p class="text-sm text-muted-foreground">No hay negocios registrados aún.</p>
      </div>

      <div *ngIf="!loading && restaurants.length" class="space-y-3">
        <div
          *ngFor="let restaurant of restaurants"
          class="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-card-foreground">{{ restaurant.name }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                [ngClass]="restaurant.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                {{ restaurant.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="text-sm text-muted-foreground">
              Slug: {{ restaurant.slug }}
              <span class="ml-2 text-xs text-muted-foreground">
                URL: {{ getRestaurantUrl(restaurant.slug) }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              (click)="setActive(restaurant)"
              class="touch-target flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              [ngClass]="
                activeRestaurantId === restaurant.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              "
              [disabled]="activeRestaurantId === restaurant.id"
            >
              <app-icon class="h-4 w-4" name="check-circle"></app-icon>
              {{ activeRestaurantId === restaurant.id ? 'Activo' : 'Usar' }}
            </button>
            <button
              (click)="toggleStatus(restaurant)"
              class="touch-target flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <app-icon class="h-4 w-4" name="check-circle"></app-icon>
              {{ restaurant.isActive ? 'Desactivar' : 'Activar' }}
            </button>
            <button
              (click)="startEdit(restaurant)"
              class="touch-target flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <app-icon class="h-4 w-4" name="pencil"></app-icon>
              Editar
            </button>
            <button
              (click)="handleDelete(restaurant)"
              class="touch-target flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <app-icon class="h-4 w-4" name="trash-2"></app-icon>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <ng-template #formRow>
        <div class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
            <input
              [(ngModel)]="form.name"
              name="name"
              (ngModelChange)="handleNameChange($event)"
              class="touch-target w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground"
              placeholder="Restaurante Central"
            />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Slug</label>
            <input
              [(ngModel)]="form.slug"
              name="slug"
              (ngModelChange)="slugTouched = true"
              class="touch-target w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground"
              placeholder="restaurante-central"
            />
          </div>
          <div class="flex items-center gap-2 pb-2">
            <input
              [(ngModel)]="form.isActive"
              name="isActive"
              type="checkbox"
              class="h-4 w-4 rounded border text-primary focus:ring-primary"
            />
            <span class="text-sm text-muted-foreground">Activo</span>
          </div>
          <div class="flex gap-2">
            <button
              (click)="save()"
              class="touch-target flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <app-icon class="h-4 w-4" name="check"></app-icon>
              Guardar
            </button>
            <button
              (click)="cancel()"
              class="touch-target flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <app-icon class="h-4 w-4" name="x"></app-icon>
              Cancelar
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class RestaurantsPageComponent {
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
  ) {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.restaurants = await firstValueFrom(this.restaurantsService.list());
    } catch {
      this.toast.error('No se pudieron cargar los negocios');
    } finally {
      this.loading = false;
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

  get activeRestaurantId(): string | null {
    return this.tenant.activeRestaurantId();
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
