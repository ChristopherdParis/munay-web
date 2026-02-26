import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import { MenuItem, Order, OrderItem } from '../lib/types';
import { IconComponent } from '../ui/icon.component';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex min-h-[calc(100vh-57px)] flex-col lg:flex-row">
      <div class="flex-1 border-b lg:border-b-0 lg:border-r">
        <div class="sticky top-[57px] z-10 border-b bg-card px-4 py-3">
          <div class="flex items-center gap-3">
            <button
              (click)="goBack()"
              class="touch-target flex items-center justify-center rounded-lg p-2 hover:bg-secondary"
            >
              <app-icon class="h-5 w-5" name="arrow-left"></app-icon>
            </button>
            <h2 class="text-lg font-bold">Table {{ tableNumber() }}</h2>
          </div>
          <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              *ngFor="let category of categories()"
              (click)="setActiveCategory(category)"
              class="touch-target whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
              [ngClass]="
                currentCategory() === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              "
            >
              {{ category }}
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
          <button
            *ngFor="let item of filteredItems()"
            (click)="addItem(item)"
            class="touch-target flex items-center justify-between rounded-xl border bg-card p-4 text-left transition-all hover:shadow-sm hover:border-primary/30 active:scale-[0.98]"
          >
            <div>
              <div class="font-medium text-card-foreground">{{ item.name }}</div>
              <div class="text-sm text-muted-foreground">\${{ item.price.toFixed(2) }}</div>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <app-icon class="h-4 w-4" name="plus"></app-icon>
            </div>
          </button>
        </div>
      </div>

      <div class="flex w-full flex-col lg:w-96">
        <div class="border-b bg-card px-4 py-3">
          <h3 class="font-bold text-card-foreground">Order Summary</h3>
          <p class="text-xs text-muted-foreground">
            {{ orderItems().length }} item{{ orderItems().length !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <p *ngIf="orderItems().length === 0" class="py-8 text-center text-sm text-muted-foreground">
            Tap menu items to add them
          </p>
          <div *ngIf="orderItems().length !== 0" class="space-y-3">
            <div
              *ngFor="let item of orderItems()"
              class="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div class="flex-1">
                <div class="text-sm font-medium text-card-foreground">{{ item.menuItem?.name }}</div>
                <div class="text-xs text-muted-foreground">
                  \${{ ((item.menuItem?.price ?? item.unitPrice) * item.quantity).toFixed(2) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="updateQty(item.menuItemId, -1)"
                  class="touch-target flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <app-icon *ngIf="item.quantity === 1" class="h-3.5 w-3.5" name="trash-2"></app-icon>
                  <app-icon *ngIf="item.quantity !== 1" class="h-3.5 w-3.5" name="minus"></app-icon>
                </button>
                <span class="w-6 text-center text-sm font-bold">{{ item.quantity }}</span>
                <button
                  (click)="updateQty(item.menuItemId, 1)"
                  class="touch-target flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                >
                  <app-icon class="h-3.5 w-3.5" name="plus"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t bg-card p-4">
          <div class="mb-4 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <div class="flex items-center justify-between">
              <span>Mesa {{ tableNumber() }}</span>
              <span class="font-semibold text-foreground">{{ tableStatusLabel() }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span>Pago</span>
              <span class="font-semibold text-foreground">{{ paymentTimingLabel() }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span>Ordenes abiertas</span>
              <span class="font-semibold text-foreground">{{ openOrders().length }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span>Pendientes de pago</span>
              <span class="font-semibold text-foreground">{{ unpaidCount() }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                (click)="togglePaymentTiming()"
                class="rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cambiar pago
              </button>
              <button
                (click)="payAllForTable()"
                class="rounded-lg bg-success px-3 py-2 text-xs font-semibold text-success-foreground hover:opacity-90"
              >
                Marcar pagadas
              </button>
              <button
                (click)="releaseTable()"
                [disabled]="!canReleaseTable()"
                class="rounded-lg px-3 py-2 text-xs font-semibold"
                [ngClass]="
                  canReleaseTable()
                    ? 'bg-success/15 text-success'
                    : 'bg-muted/50 text-muted-foreground'
                "
              >
                Liberar mesa
              </button>
            </div>
          </div>
          <div *ngIf="openOrders().length !== 0" class="mb-3">
            <div class="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Ordenes abiertas</span>
              <span>{{ openOrders().length }}</span>
            </div>
            <div class="space-y-2">
            <div
              *ngFor="let order of openOrders()"
              class="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground"
            >
              <div class="flex items-center justify-between">
                <span>Orden {{ order.id.slice(0, 6) }}</span>
                <span>{{ orderStatusLabel(order.status) }}</span>
              </div>
                <div class="mt-2 space-y-1">
                  <div *ngFor="let item of order.items" class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{ item.menuItem?.name }}</span>
                    <span class="text-xs font-semibold text-card-foreground">x{{ item.quantity }}</span>
                  </div>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs">
                  <span>Total</span>
                  <span class="font-semibold text-card-foreground">\${{ order.total.toFixed(2) }}</span>
                </div>
                <div class="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <button
                    (click)="cancelOrder(order.id)"
                    class="flex-1 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Cancelar orden
                  </button>
                  <button
                    *ngIf="!order.paid && order.status !== 'cancelled'"
                    (click)="payOrder(order.id)"
                    class="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-success-foreground hover:opacity-90"
                  >
                    Pagar
                  </button>
                </div>
            </div>
            </div>
          </div>
          <div class="mb-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>\${{ total().toFixed(2) }}</span>
          </div>
          <button
            (click)="handleSubmit()"
            [disabled]="orderItems().length === 0"
            class="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <app-icon class="h-5 w-5" name="send"></app-icon>
            Send to Kitchen
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OrderPageComponent {
  readonly tableNumber = signal(0);
  readonly orderItems = signal<OrderItem[]>([]);
  readonly activeCategory = signal<string | null>(null);
  readonly currentOrder = computed<Order | null>(() => {
    const table = this.tableNumber();
    if (!table) {
      return null;
    }
    const candidates = this.store
      .orders()
      .filter(
        (order) =>
          order.tableNumber === table && order.status !== 'cancelled' && order.status !== 'delivered',
      );
    return candidates[0] ?? null;
  });

  readonly categories = computed(() => {
    const items = this.store.menuItems();
    return [...new Set(items.map((item) => item.category))];
  });

  readonly currentCategory = computed(() => this.activeCategory() ?? this.categories()[0]);

  readonly filteredItems = computed(() => {
    const category = this.currentCategory();
    if (!category) {
      return [];
    }
    return this.store.menuItems().filter((item) => item.category === category);
  });

  readonly total = computed(() =>
    this.orderItems().reduce(
      (sum, item) => sum + (item.menuItem?.price ?? item.unitPrice) * item.quantity,
      0,
    ),
  );

  readonly openOrders = computed(() => {
    const table = this.tableNumber();
    if (!table) {
      return [];
    }
    return this.store
      .orders()
      .filter(
        (order) =>
          order.tableNumber === table &&
          order.status !== 'cancelled' &&
          order.status !== 'delivered',
      );
  });

  readonly activeTable = computed(() => {
    const tableNumber = this.tableNumber();
    return this.store.tables().find((table) => table.number === tableNumber) ?? null;
  });

  readonly unpaidCount = computed(() => {
    const table = this.tableNumber();
    return this.store
      .orders()
      .filter((order) => order.tableNumber === table && order.status !== 'cancelled')
      .filter((order) => !order.paid).length;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: StoreService,
    private readonly toast: ToastService,
  ) {
    const tableNumberParam = Number(this.route.snapshot.paramMap.get('tableNumber'));
    this.tableNumber.set(Number.isNaN(tableNumberParam) ? 0 : tableNumberParam);
  }

  tableStatusLabel(): string {
    const table = this.activeTable();
    if (!table) {
      return 'Sin estado';
    }
    switch (table.status) {
      case 'free':
        return 'Libre';
      case 'seated':
        return 'Sentados';
      case 'ordered':
        return 'Ordenado';
      case 'served':
        return 'Servido';
      default:
        return table.status;
    }
  }

  paymentTimingLabel(): string {
    const table = this.activeTable();
    if (!table) {
      return 'Pago al final';
    }
    return table.paymentTiming === 'start' ? 'Pago al inicio' : 'Pago al final';
  }

  async togglePaymentTiming(): Promise<void> {
    const table = this.activeTable();
    if (!table) {
      return;
    }
    const next = table.paymentTiming === 'start' ? 'end' : 'start';
    try {
      await this.store.setTablePaymentTiming(table.id, next);
    } catch {
      this.toast.error('No se pudo actualizar el pago');
    }
  }

  async payAllForTable(): Promise<void> {
    try {
      await this.store.markOrdersPaidForTable(this.tableNumber());
      this.toast.success('Ordenes marcadas como pagadas');
    } catch {
      this.toast.error('No se pudieron marcar las ordenes');
    }
  }

  canReleaseTable(): boolean {
    return this.store.canReleaseTable(this.tableNumber());
  }

  async releaseTable(): Promise<void> {
    const table = this.activeTable();
    if (!table) {
      return;
    }
    if (!this.canReleaseTable()) {
      this.toast.error('Hay ordenes pendientes de pago');
      return;
    }
    if (!window.confirm('Liberar esta mesa?')) {
      return;
    }
    try {
      await this.store.releaseTable(table.id);
      this.toast.success('Mesa liberada');
      this.router.navigate(['/']);
    } catch {
      this.toast.error('No se pudo liberar la mesa');
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setActiveCategory(category: string): void {
    this.activeCategory.set(category);
  }

  addItem(menuItem: MenuItem): void {
    this.orderItems.update((items) => {
      const existing = items.find((item) => item.menuItemId === menuItem.id);
      if (existing) {
        return items.map((item) =>
          item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...items,
        { menuItemId: menuItem.id, quantity: 1, unitPrice: menuItem.price, menuItem },
      ];
    });
  }

  updateQty(id: string, delta: number): void {
    this.orderItems.update((items) =>
      items
        .map((item) =>
          item.menuItemId === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async handleSubmit(): Promise<void> {
    if (this.orderItems().length === 0) {
      return;
    }
    try {
      await this.store.submitOrder(this.tableNumber(), this.orderItems());
      this.toast.success(`Order sent to kitchen for Table ${this.tableNumber()}`);
      this.router.navigate(['/']);
    } catch {
      this.toast.error('No se pudo enviar la orden');
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (!window.confirm('Cancelar esta orden?')) {
      return;
    }
    try {
      await this.store.cancelOrder(orderId);
      this.toast.success('Orden cancelada');
    } catch {
      this.toast.error('No se pudo cancelar la orden');
    }
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
