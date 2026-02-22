import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import { TableStatus } from '../lib/types';
import { IconComponent, IconName } from '../ui/icon.component';

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; className: string; icon: IconName }
> = {
  free: { label: 'Free', className: 'bg-success/10 text-success', icon: 'coffee' },
  ordering: { label: 'Ordering', className: 'bg-warning/10 text-warning', icon: 'shopping-bag' },
  occupied: { label: 'Occupied', className: 'bg-primary/10 text-primary', icon: 'users' },
};

@Component({
  selector: 'app-tables-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="container py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-foreground">Tables</h1>
        <p class="text-sm text-muted-foreground">Tap a table to start or view an order</p>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <button
          *ngFor="let table of store.tables()"
          (click)="goToOrder(table.number)"
          class="touch-target group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.97]"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full" [ngClass]="statusConfig[table.status].className">
            <app-icon class="h-5 w-5" [name]="statusConfig[table.status].icon"></app-icon>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-card-foreground">Table {{ table.number }}</div>
            <span
              class="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium"
              [ngClass]="statusConfig[table.status].className"
            >
              {{ statusConfig[table.status].label }}
            </span>
          </div>
        </button>
      </div>
    </div>
  `,
})
export class TablesPageComponent {
  readonly statusConfig = STATUS_CONFIG;

  constructor(readonly store: StoreService, private readonly router: Router) {}

  goToOrder(tableNumber: number): void {
    this.router.navigate(['/order', tableNumber]);
  }
}
