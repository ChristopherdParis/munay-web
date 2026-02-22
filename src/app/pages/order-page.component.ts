import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import { MenuItem, OrderItem } from '../lib/types';
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
                <div class="text-sm font-medium text-card-foreground">{{ item.menuItem.name }}</div>
                <div class="text-xs text-muted-foreground">
                  \${{ (item.menuItem.price * item.quantity).toFixed(2) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="updateQty(item.menuItem.id, -1)"
                  class="touch-target flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <app-icon *ngIf="item.quantity === 1" class="h-3.5 w-3.5" name="trash-2"></app-icon>
                  <app-icon *ngIf="item.quantity !== 1" class="h-3.5 w-3.5" name="minus"></app-icon>
                </button>
                <span class="w-6 text-center text-sm font-bold">{{ item.quantity }}</span>
                <button
                  (click)="updateQty(item.menuItem.id, 1)"
                  class="touch-target flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                >
                  <app-icon class="h-3.5 w-3.5" name="plus"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t bg-card p-4">
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
    this.orderItems().reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: StoreService,
    private readonly toast: ToastService,
  ) {
    const tableNumberParam = Number(this.route.snapshot.paramMap.get('tableNumber'));
    this.tableNumber.set(Number.isNaN(tableNumberParam) ? 0 : tableNumberParam);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setActiveCategory(category: string): void {
    this.activeCategory.set(category);
  }

  addItem(menuItem: MenuItem): void {
    this.orderItems.update((items) => {
      const existing = items.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return items.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...items, { menuItem, quantity: 1 }];
    });
  }

  updateQty(id: string, delta: number): void {
    this.orderItems.update((items) =>
      items
        .map((item) =>
          item.menuItem.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  handleSubmit(): void {
    if (this.orderItems().length === 0) {
      return;
    }
    this.store.submitOrder(this.tableNumber(), this.orderItems());
    this.toast.success(`Order sent to kitchen for Table ${this.tableNumber()}`);
    this.router.navigate(['/']);
  }
}
