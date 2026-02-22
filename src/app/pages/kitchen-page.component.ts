import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { StoreService } from '../lib/store.service';
import { IconComponent } from '../ui/icon.component';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="min-h-[calc(100vh-57px)] bg-kitchen text-kitchen-foreground">
      <div class="container py-6">
        <div class="mb-6 flex items-center gap-3">
          <app-icon class="h-7 w-7 text-kitchen-accent" name="utensils-crossed"></app-icon>
          <h1 class="text-2xl font-bold">Kitchen Display</h1>
        </div>

        <div
          *ngIf="undoAction()"
          class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-kitchen-card px-4 py-3 text-sm"
        >
          <span>{{ undoMessage() }}</span>
          <button
            (click)="undoFromSnackbar()"
            class="touch-target rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90"
          >
            Undo
          </button>
        </div>

        <section class="mb-8">
          <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <app-icon class="h-5 w-5 text-kitchen-accent" name="clock"></app-icon>
            Incoming Orders ({{ pendingOrders().length }})
          </h2>
          <p
            *ngIf="pendingOrders().length === 0"
            class="rounded-xl bg-kitchen-card p-8 text-center text-kitchen-foreground/50"
          >
            No pending orders
          </p>
          <div *ngIf="pendingOrders().length !== 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              *ngFor="let order of pendingOrders()"
              class="animate-slide-in rounded-xl border border-kitchen-accent/20 bg-kitchen-card p-5 shadow-lg"
            >
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xl font-bold text-kitchen-accent">Table {{ order.tableNumber }}</span>
                <span class="text-xs text-kitchen-foreground/50">{{ formatDistanceToNow(order.createdAt) }}</span>
              </div>
              <ul class="mb-4 space-y-1.5">
                <li *ngFor="let item of order.items" class="flex justify-between text-sm">
                  <span>{{ item.menuItem.name }}</span>
                  <span class="font-bold text-kitchen-foreground/70">x{{ item.quantity }}</span>
                </li>
              </ul>
              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  (click)="cancelOrder(order.id, order.tableNumber)"
                  class="touch-target flex-1 rounded-xl border border-kitchen-foreground/20 py-3 text-sm font-medium text-kitchen-foreground/80 transition-all hover:bg-kitchen-foreground/10 active:scale-[0.98]"
                >
                  Cancel Order
                </button>
                <button
                  (click)="markReady(order.id, order.tableNumber)"
                  class="touch-target flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-success-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Mark as Ready
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <app-icon class="h-5 w-5 text-success" name="check-circle"></app-icon>
            Ready to Serve ({{ readyOrders().length }})
          </h2>
          <p
            *ngIf="readyOrders().length === 0"
            class="rounded-xl bg-kitchen-card p-8 text-center text-kitchen-foreground/50"
          >
            No ready orders
          </p>
          <div *ngIf="readyOrders().length !== 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              *ngFor="let order of readyOrders()"
              class="animate-pulse-soft rounded-xl border border-success/30 bg-kitchen-card p-5"
            >
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xl font-bold text-success">Table {{ order.tableNumber }}</span>
                <span class="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">Ready</span>
              </div>
              <ul class="mb-4 space-y-1 text-sm text-kitchen-foreground/70">
                <li *ngFor="let item of order.items">{{ item.quantity }}x {{ item.menuItem.name }}</li>
              </ul>
              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  (click)="undoReady(order.id)"
                  class="touch-target flex-1 rounded-xl border border-kitchen-foreground/20 py-3 text-sm font-medium text-kitchen-foreground/80 transition-all hover:bg-kitchen-foreground/10 active:scale-[0.98]"
                >
                  Undo Ready
                </button>
                <button
                  (click)="markServed(order.id)"
                  class="touch-target flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-success-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Mark as Served
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class KitchenPageComponent {
  readonly pendingOrders = computed(() =>
    this.store.orders().filter((order) => order.status === 'pending' || order.status === 'preparing'),
  );

  readonly readyOrders = computed(() => this.store.orders().filter((order) => order.status === 'ready'));
  readonly undoAction = signal<{ id: string; type: 'ready' | 'cancel' } | null>(null);
  readonly undoMessage = computed(() => {
    const action = this.undoAction();
    if (!action) {
      return '';
    }
    return action.type === 'ready' ? 'Order marked as ready.' : 'Order canceled.';
  });
  private undoTimer: number | null = null;

  constructor(private readonly store: StoreService, private readonly toast: ToastService) {}

  markReady(orderId: string, tableNumber: number): void {
    this.store.markOrderReady(orderId);
    this.toast.success(`Table ${tableNumber} order is ready!`);
    this.startUndoTimer(orderId, 'ready');
  }

  markServed(orderId: string): void {
    this.store.markOrderServed(orderId);
    this.toast.success('Order marked as served');
  }

  cancelOrder(orderId: string, tableNumber: number): void {
    if (!window.confirm('Cancelar esta orden?')) {
      return;
    }
    this.store.cancelOrder(orderId);
    this.toast.success(`Order for Table ${tableNumber} canceled`);
    this.startUndoTimer(orderId, 'cancel');
  }

  undoReady(orderId: string): void {
    if (!this.confirmUndo()) {
      return;
    }
    this.store.markOrderPending(orderId);
    this.toast.success('Order moved back to incoming');
  }

  undoFromSnackbar(): void {
    const action = this.undoAction();
    if (!action) {
      return;
    }
    if (!this.confirmUndo()) {
      return;
    }
    this.store.markOrderPending(action.id);
    this.toast.success('Order moved back to incoming');
    this.clearUndoTimer();
  }

  formatDistanceToNow(date: Date): string {
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (absSeconds < 60) {
      return rtf.format(diffSeconds, 'second');
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    const diffDays = Math.round(diffHours / 24);
    return rtf.format(diffDays, 'day');
  }

  private startUndoTimer(orderId: string, type: 'ready' | 'cancel'): void {
    this.clearUndoTimer();
    this.undoAction.set({ id: orderId, type });
    this.undoTimer = window.setTimeout(() => {
      this.undoAction.set(null);
      this.undoTimer = null;
    }, 6000);
  }

  private clearUndoTimer(): void {
    if (this.undoTimer !== null) {
      window.clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
    this.undoAction.set(null);
  }

  private confirmUndo(): boolean {
    return window.confirm('Revertir el estado de esta orden a Incoming?');
  }
}
