import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-select-restaurant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container flex min-h-[calc(100vh-57px)] items-center justify-center py-10">
      <div class="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
        <h1 class="text-xl font-semibold text-foreground">Selecciona tu negocio</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Ingresa el slug de tu negocio para continuar.
        </p>
        <div class="mt-4 space-y-3">
          <input
            [(ngModel)]="slug"
            name="slug"
            class="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="ej: la-trattoria"
          />
          <button
            (click)="goToRestaurant()"
            class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Continuar
          </button>
        </div>
        <div class="mt-4 text-xs text-muted-foreground">
          Si no tienes el slug, contacta al administrador del sistema.
        </div>
      </div>
    </div>
  `,
})
export class SelectRestaurantPageComponent {
  slug = '';

  constructor(private readonly router: Router, private readonly toast: ToastService) {}

  goToRestaurant(): void {
    const value = this.slug.trim();
    if (!value) {
      this.toast.error('Ingresa el slug del negocio');
      return;
    }
    this.router.navigate(['/r', value]);
  }
}
