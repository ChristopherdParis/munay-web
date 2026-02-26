import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-order-history-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-6">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Historial de Ordenes</h1>
          <p class="text-sm text-muted-foreground">
            {{ filteredOrders().length }} orden{{ filteredOrders().length !== 1 ? 'es' : '' }}
          </p>
        </div>
        <div class="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="number"
            min="1"
            class="w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground sm:w-24"
            placeholder="Mesa"
            [value]="tableFilter() ?? ''"
            (change)="setTableFilter($event)"
          />
          <button
            (click)="clearFilter()"
            class="touch-target rounded-lg border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div *ngIf="filteredOrders().length === 0" class="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No hay ordenes para mostrar.
      </div>

      <div class="space-y-4">
        <div
          *ngFor="let order of filteredOrders()"
          class="rounded-xl border bg-card p-4"
        >
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div class="text-sm font-semibold text-foreground">Mesa {{ order.tableNumber }}</div>
            <div class="text-xs text-muted-foreground">{{ orderStatusLabel(order.status) }}</div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Orden {{ order.id.slice(0, 6) }}</span>
            <span>Total: \${{ order.total.toFixed(2) }}</span>
          </div>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="rounded-full border px-2 py-0.5">
              {{ order.paymentTiming === 'start' ? 'Pago al inicio' : 'Pago al final' }}
            </span>
            <span
              class="rounded-full px-2 py-0.5"
              [ngClass]="order.paid ? 'bg-success/15 text-success' : 'bg-warning/10 text-warning'"
            >
              {{ order.paid ? 'Pagado' : 'Por pagar' }}
            </span>
          </div>
          <div class="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-muted-foreground">
              Items: {{ order.items.length }}
            </div>
            <button
              *ngIf="!order.paid && order.status !== 'cancelled'"
              (click)="payOrder(order.id)"
              class="touch-target rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90"
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OrderHistoryPageComponent {
  readonly tableFilter = signal<number | null>(null);

  readonly filteredOrders = computed(() => {
    const table = this.tableFilter();
    const orders = this.store.orders();
    return table ? orders.filter((order) => order.tableNumber === table) : orders;
  });

  constructor(
    private readonly store: StoreService,
    private readonly toast: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    const param = this.route.snapshot.queryParamMap.get('table');
    const parsed = param ? Number(param) : Number.NaN;
    if (!Number.isNaN(parsed)) {
      this.tableFilter.set(parsed);
    }
  }

  setTableFilter(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = input ? Number(input.value) : Number.NaN;
    if (Number.isNaN(value) || value <= 0) {
      this.tableFilter.set(null);
      this.router.navigate([], { queryParams: { table: null }, queryParamsHandling: 'merge' });
      return;
    }
    this.tableFilter.set(value);
    this.router.navigate([], { queryParams: { table: value }, queryParamsHandling: 'merge' });
  }

  clearFilter(): void {
    this.tableFilter.set(null);
    this.router.navigate([], { queryParams: { table: null }, queryParamsHandling: 'merge' });
  }

  async payOrder(orderId: string): Promise<void> {
    try {
      await this.store.markOrderPaid(orderId);
      this.toast.success('Orden pagada');
    } catch {
      this.toast.error('No se pudo marcar como pagada');
    }
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
        return 'Lista para servir';
      case 'delivered':
        return 'Servida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }
}
