import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from '../lib/orders.service';
import { RestaurantsService } from '../lib/restaurants.service';
import { TenantService } from '../lib/tenant.service';
import { Order, Restaurant } from '../lib/types';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-owner-restaurant-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Historial</p>
          <h1 class="text-2xl font-semibold text-white">{{ restaurant?.name ?? 'Negocio' }}</h1>
          <p class="text-sm text-slate-400">Ordenes: {{ orders.length }}</p>
        </div>
        <button
          (click)="goBack()"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
        >
          Volver
        </button>
      </div>

      <div *ngIf="loading" class="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Cargando historial...
      </div>

      <div *ngIf="!loading && orders.length === 0" class="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Sin ordenes registradas.
      </div>

      <div *ngIf="!loading && orders.length" class="space-y-3">
        <div
          *ngFor="let order of orders"
          class="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-sm font-semibold text-white">Mesa {{ order.tableNumber }}</div>
            <div class="text-xs text-slate-300">{{ orderStatusLabel(order.status) }}</div>
          </div>
          <div class="mt-1 text-xs text-slate-400">
            Orden {{ order.id.slice(0, 6) }} · {{ order.createdAt | date: 'short' }}
          </div>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <span>Total: \${{ order.total.toFixed(2) }}</span>
            <span>{{ order.paid ? 'Pagado' : 'Por pagar' }}</span>
          </div>
          <div class="mt-3 grid gap-2 text-xs text-slate-400">
            <div *ngFor="let item of order.items">
              {{ item.quantity }}x {{ item.menuItem?.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRestaurantHistoryComponent {
  restaurant: Restaurant | null = null;
  orders: Order[] = [];
  loading = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly restaurantsService: RestaurantsService,
    private readonly ordersService: OrdersService,
    private readonly tenant: TenantService,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('Negocio inválido');
      this.goBack();
      return;
    }
    this.loading = true;
    try {
      this.restaurant = await firstValueFrom(this.restaurantsService.findOne(id));
      this.tenant.setActiveRestaurant(this.restaurant.id, this.restaurant.name);
      const orders = await firstValueFrom(this.ordersService.list());
      this.orders = Array.isArray(orders) ? orders : [];
    } catch {
      this.toast.error('No se pudo cargar el historial');
      this.orders = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  goBack(): void {
    this.router.navigate(['/owner/restaurants']);
  }

  orderStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Lista';
      case 'delivered':
        return 'Entregada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }
}
