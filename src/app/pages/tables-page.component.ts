import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import {
  FloorPlan,
  PaymentStatus,
  PaymentTiming,
  RestaurantTable,
  TableGrid,
  TablePosition,
  TableStatus,
} from '../lib/types';
import { IconComponent, IconName } from '../ui/icon.component';
import { ToastService } from '../ui/toast.service';

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; className: string; icon: IconName }
> = {
  free: { label: 'Libre', className: 'bg-success/10 text-success', icon: 'coffee' },
  seated: { label: 'Sentados', className: 'bg-primary/10 text-primary', icon: 'users' },
  ordered: { label: 'Ordenado', className: 'bg-warning/10 text-warning', icon: 'shopping-bag' },
  served: { label: 'Servido', className: 'bg-success/20 text-success', icon: 'check-circle' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Por pagar', className: 'bg-warning/10 text-warning' },
  paid: { label: 'Pagado', className: 'bg-success/15 text-success' },
};

const PAYMENT_TIMING_LABEL: Record<PaymentTiming, string> = {
  start: 'Paga al inicio',
  end: 'Paga al final',
};

@Component({
  selector: 'app-tables-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="container py-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Tables</h1>
          <p class="text-sm text-muted-foreground">Tap a table to start or view an order</p>
        </div>
        <div class="inline-flex rounded-xl border bg-card p-1">
          <button
            (click)="setTab('tables')"
            class="touch-target rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [ngClass]="activeTab() === 'tables' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
          >
            Mesas
          </button>
          <button
            (click)="setTab('layout')"
            class="touch-target rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [ngClass]="activeTab() === 'layout' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
          >
            Croquis
          </button>
        </div>
      </div>

      <ng-container *ngIf="activeTab() === 'tables'; else layoutTab">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-muted-foreground">Piso:</span>
          <div class="inline-flex flex-wrap rounded-lg border bg-card p-1">
            <button
              *ngFor="let floor of floorList(store.floorPlan().floors)"
              class="touch-target rounded-md px-3 py-1 text-sm font-medium"
              [ngClass]="activeFloor() === floor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
              (click)="setActiveFloor(floor)"
            >
              Piso {{ floor }}
            </button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div class="rounded-xl border bg-card p-4">
            <div class="relative overflow-auto rounded-xl bg-muted/10 p-3">
              <div
                class="grid gap-2"
                [ngStyle]="gridStyle(store.floorPlan())"
              >
              <div
                *ngFor="let cell of gridCells(store.floorPlan().grid)"
                class="rounded-lg border border-dashed border-border/80 bg-slate-300/80"
              ></div>
              <div
                *ngFor="let entry of tablesForActiveFloor()"
                (click)="goToOrder(entry.table.number)"
                class="touch-target group flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.97]"
                [ngStyle]="tableStyle(entry.position)"
              >
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full"
                  [ngClass]="statusConfig[entry.table.status].className"
                >
                  <app-icon class="h-4 w-4" [name]="statusConfig[entry.table.status].icon"></app-icon>
                </div>
                <div class="text-center">
                  <div class="text-sm font-bold text-card-foreground">Table {{ entry.table.number }}</div>
                  <button
                    type="button"
                    class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                    [ngClass]="statusConfig[entry.table.status].className"
                    (click)="cycleStatus(entry.table, $event)"
                  >
                    {{ statusConfig[entry.table.status].label }}
                  </button>
                  <div class="mt-2 flex flex-wrap items-center justify-center gap-1 text-[10px]">
                    <button
                      type="button"
                      class="rounded-full px-2 py-0.5 font-medium"
                      [ngClass]="paymentStatusConfig[entry.table.paymentStatus].className"
                      (click)="togglePaid(entry.table, $event)"
                    >
                      {{ paymentStatusConfig[entry.table.paymentStatus].label }}
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-border/60 px-2 py-0.5 font-medium text-muted-foreground hover:text-foreground"
                      (click)="togglePaymentTiming(entry.table, $event)"
                    >
                      {{ paymentTimingLabel[entry.table.paymentTiming] }}
                    </button>
                  </div>
                  <div class="mt-2 text-[10px] text-muted-foreground">
                    Ordenes: {{ orderTotals(entry.table.number).total }} - Pendientes: {{ orderTotals(entry.table.number).unpaid }}
                  </div>
                  <div class="mt-2 flex flex-wrap items-center justify-center gap-1">
                    <button
                      type="button"
                      class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      (click)="payAll(entry.table, $event)"
                    >
                      Marcar pagadas
                    </button>
                    <button
                      type="button"
                      class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      [ngClass]="
                        canRelease(entry.table)
                          ? 'bg-success/15 text-success'
                          : 'bg-muted/50 text-muted-foreground'
                      "
                      (click)="releaseTable(entry.table, $event)"
                    >
                      Liberar mesa
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      (click)="toggleOrders(entry.table.id, $event)"
                    >
                      {{ expandedTableId() === entry.table.id ? 'Ocultar ordenes' : 'Ver ordenes' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      (click)="goToHistory(entry.table.number, $event)"
                    >
                      Historial
                    </button>
                  </div>
                  <div
                    *ngIf="expandedTableId() === entry.table.id"
                    class="mt-3 rounded-lg border border-border/60 bg-muted/20 p-2 text-[10px] text-muted-foreground"
                  >
                    <div *ngIf="ordersForTable(entry.table.number).length === 0" class="text-center">
                      Sin ordenes registradas.
                    </div>
                    <div *ngFor="let order of ordersForTable(entry.table.number)" class="mb-2 rounded-md border bg-card px-2 py-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="font-semibold">Orden {{ order.id.slice(0, 6) }}</span>
                        <span>{{ orderStatusLabel(order.status) }}</span>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span>{{ order.paymentTiming === 'start' ? 'Inicio' : 'Final' }}</span>
                        <span>{{ order.paid ? 'Pagado' : 'Por pagar' }}</span>
                      </div>
                      <div class="mt-1 flex items-center justify-between gap-2">
                        <span>Total: \${{ order.total.toFixed(2) }}</span>
                        <button
                        *ngIf="!order.paid && order.status !== 'cancelled'"
                          type="button"
                          class="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
                          (click)="payOrder(order.id, $event)"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border bg-card p-4">
            <h2 class="mb-3 text-sm font-semibold text-foreground">Sin ubicar</h2>
            <div class="space-y-2">
              <div
                *ngFor="let table of unplacedTables()"
                class="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground"
              >
                <span>Table {{ table.number }}</span>
                <span class="text-xs">Sin posicion</span>
              </div>
              <div *ngIf="unplacedTables().length === 0" class="text-sm text-muted-foreground">
                Todas las mesas estan ubicadas.
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #layoutTab>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Pisos:</span>
            <div class="inline-flex rounded-lg border bg-card p-1">
              <button
                class="touch-target rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                (click)="addFloor()"
              >
                + Piso
              </button>
              <button
                class="touch-target rounded-md px-3 py-1 text-sm font-medium"
                [ngClass]="draftPlan().floors === 1 ? 'text-muted-foreground opacity-50' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
                [disabled]="draftPlan().floors === 1"
                (click)="removeFloor()"
              >
                - Piso
              </button>
            </div>
            <span class="text-xs text-muted-foreground">Total: {{ draftPlan().floors }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="resetDraft()"
              class="touch-target rounded-lg border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              (click)="saveDraft()"
              class="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Guardar croquis
            </button>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Editar piso:</span>
            <div class="inline-flex flex-wrap rounded-lg border bg-card p-1">
              <button
                *ngFor="let floor of floorList(draftPlan().floors)"
                class="touch-target rounded-md px-3 py-1 text-sm font-medium"
                [ngClass]="activeFloor() === floor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
                (click)="setActiveFloor(floor)"
              >
                Piso {{ floor }}
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Grilla:</span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="2"
                max="20"
                class="w-20 rounded-md border bg-card px-2 py-1 text-sm text-foreground"
                [value]="draftPlan().grid.columns"
                (change)="setGridSize('columns', $event)"
              />
              <span class="text-xs text-muted-foreground">Columnas</span>
            </div>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="2"
                max="20"
                class="w-20 rounded-md border bg-card px-2 py-1 text-sm text-foreground"
                [value]="draftPlan().grid.rows"
                (change)="setGridSize('rows', $event)"
              />
              <span class="text-xs text-muted-foreground">Filas</span>
            </div>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div class="rounded-xl border bg-card p-4">
            <div
              class="relative overflow-auto rounded-xl bg-muted/10 p-3"
            >
              <div
                class="grid gap-2"
                [ngStyle]="gridStyle(draftPlan())"
              >
              <button
                *ngFor="let cell of gridCells(draftPlan().grid)"
                class="rounded-lg border border-dashed border-border/80 transition hover:border-primary/70"
                [ngClass]="cellHasTable(cell.x, cell.y) ? 'bg-primary/10' : 'bg-slate-300/80'"
                (click)="handleCellClick(cell.x, cell.y)"
                (dragover)="handleCellDragOver($event, cell.x, cell.y)"
                (drop)="handleCellDrop($event, cell.x, cell.y)"
              ></button>
              <div
                *ngFor="let entry of draftTablesForActiveFloor()"
                class="flex flex-col items-center justify-center gap-1 rounded-xl border bg-card p-2 text-xs font-semibold text-foreground shadow-sm"
                [ngStyle]="tableStyle(entry.position)"
                draggable="true"
                (dragstart)="handleTableDragStart($event, entry.table.id)"
              >
                <div class="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  {{ entry.table.number }}
                </div>
                <span>Table {{ entry.table.number }}</span>
              </div>
            </div>
            </div>
          </div>

          <div class="rounded-xl border bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Mesas</h2>
              <button
                (click)="addTable()"
                class="touch-target flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <app-icon class="h-3.5 w-3.5" name="plus"></app-icon>
                Agregar
              </button>
            </div>
            <div class="space-y-2">
              <div *ngFor="let table of store.tables()" class="flex items-center gap-2">
                <button
                  (click)="selectTable(table.id)"
                  class="flex flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition"
                  [ngClass]="
                    selectedTableId() === table.id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  "
                  draggable="true"
                  (dragstart)="handleTableDragStart($event, table.id)"
                >
                  <span>Table</span>
                  <input
                    type="number"
                    min="1"
                    class="w-16 rounded-md border bg-card px-2 py-1 text-xs text-foreground"
                    [value]="table.number"
                    (change)="handleTableNumberChange($event, table.id)"
                    (keydown.enter)="blurOnEnter($event)"
                  />
                  <span class="text-xs">
                    {{ draftPositionLabel(table.id) }}
                  </span>
                </button>
                <button
                  (click)="removeTable(table.id)"
                  class="touch-target flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  title="Eliminar mesa"
                >
                  <app-icon class="h-4 w-4" name="trash-2"></app-icon>
                </button>
              </div>
              <div class="mt-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                Selecciona una mesa y luego toca una celda. Tambien puedes arrastrar y soltar.
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class TablesPageComponent {
  readonly statusConfig = STATUS_CONFIG;
  readonly paymentStatusConfig = PAYMENT_STATUS_CONFIG;
  readonly paymentTimingLabel = PAYMENT_TIMING_LABEL;
  readonly activeTab = signal<'tables' | 'layout'>('tables');
  readonly activeFloor = signal(1);
  readonly selectedTableId = signal<string | null>(null);
  readonly expandedTableId = signal<string | null>(null);
  readonly draftPlan = signal<FloorPlan>({
    floors: 1,
    grid: { columns: 1, rows: 1 },
    positions: [],
    blocked: [],
    cellSize: 72,
    zoom: 1,
  });

  readonly tablesForActiveFloor = computed(() => {
    const plan = this.store.floorPlan();
    const floor = this.activeFloor();
    const positions = new Map(
      plan.positions.filter((pos) => pos.floor === floor).map((pos) => [pos.tableId, pos]),
    );
    const entries: Array<{ table: RestaurantTable; position: TablePosition }> = [];
    for (const table of this.store.tables()) {
      const position = positions.get(table.id);
      if (position) {
        entries.push({ table, position });
      }
    }
    return entries;
  });

  readonly ordersByTable = computed(() => {
    const map = new Map<number, { total: number; unpaid: number }>();
    for (const order of this.store.orders()) {
      if (order.status === 'cancelled') {
        continue;
      }
      const entry = map.get(order.tableNumber) ?? { total: 0, unpaid: 0 };
      entry.total += 1;
      if (!order.paid) {
        entry.unpaid += 1;
      }
      map.set(order.tableNumber, entry);
    }
    return map;
  });

  readonly unplacedTables = computed(() => {
    const plan = this.store.floorPlan();
    const positioned = new Set(plan.positions.map((pos) => pos.tableId));
    return this.store.tables().filter((table) => !positioned.has(table.id));
  });

  readonly draftTablesForActiveFloor = computed(() => {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    const positions = new Map(
      plan.positions.filter((pos) => pos.floor === floor).map((pos) => [pos.tableId, pos]),
    );
    const entries: Array<{ table: RestaurantTable; position: TablePosition }> = [];
    for (const table of this.store.tables()) {
      const position = positions.get(table.id);
      if (position) {
        entries.push({ table, position });
      }
    }
    return entries;
  });

  constructor(
    readonly store: StoreService,
    private readonly router: Router,
    private readonly toast: ToastService,
  ) {
    this.draftPlan.set(clonePlan(this.store.floorPlan()));
    effect(() => {
      const plan = this.store.floorPlan();
      if (this.activeTab() === 'tables') {
        this.draftPlan.set(clonePlan(plan));
      }
    });
  }

  goToOrder(tableNumber: number): void {
    this.router.navigate(['/order', tableNumber]);
  }

  goToHistory(tableNumber: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/history'], { queryParams: { table: tableNumber } });
  }

  async cycleStatus(table: RestaurantTable, event?: Event): Promise<void> {
    event?.stopPropagation();
    const order: TableStatus[] = ['free', 'seated', 'ordered', 'served'];
    const currentIndex = order.indexOf(table.status);
    const nextStatus = order[(currentIndex + 1) % order.length] ?? 'free';
    try {
      await this.store.setTableStatus(table.id, nextStatus);
    } catch {
      this.toast.error('No se pudo actualizar la mesa');
    }
  }

  async togglePaid(table: RestaurantTable, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (table.paymentStatus === 'paid') {
      this.toast.error('Usa el pago por orden para revertir');
      return;
    }
    try {
      await this.store.markOrdersPaidForTable(table.number);
      this.toast.success('Ordenes marcadas como pagadas');
    } catch {
      this.toast.error('No se pudieron marcar las ordenes');
    }
  }

  async togglePaymentTiming(table: RestaurantTable, event?: Event): Promise<void> {
    event?.stopPropagation();
    const next = table.paymentTiming === 'start' ? 'end' : 'start';
    try {
      await this.store.setTablePaymentTiming(table.id, next);
    } catch {
      this.toast.error('No se pudo actualizar el pago');
    }
  }

  toggleOrders(tableId: string, event?: Event): void {
    event?.stopPropagation();
    this.expandedTableId.set(this.expandedTableId() === tableId ? null : tableId);
  }

  ordersForTable(tableNumber: number) {
    return this.store.orders().filter((order) => order.tableNumber === tableNumber);
  }

  async payOrder(orderId: string, event?: Event): Promise<void> {
    event?.stopPropagation();
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

  orderTotals(tableNumber: number): { total: number; unpaid: number } {
    return this.ordersByTable().get(tableNumber) ?? { total: 0, unpaid: 0 };
  }

  async payAll(table: RestaurantTable, event?: Event): Promise<void> {
    event?.stopPropagation();
    const totals = this.orderTotals(table.number);
    if (totals.total === 0 || totals.unpaid === 0) {
      this.toast.error('No hay ordenes pendientes por pagar');
      return;
    }
    try {
      await this.store.markOrdersPaidForTable(table.number);
      this.toast.success('Ordenes marcadas como pagadas');
    } catch {
      this.toast.error('No se pudieron marcar las ordenes');
    }
  }

  canRelease(table: RestaurantTable): boolean {
    return table.status !== 'free' && this.store.canReleaseTable(table.number);
  }

  async releaseTable(table: RestaurantTable, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!this.store.canReleaseTable(table.number)) {
      this.toast.error('Hay ordenes pendientes de pago');
      return;
    }
    if (!window.confirm('Liberar esta mesa?')) {
      return;
    }
    try {
      await this.store.releaseTable(table.id);
      this.toast.success('Mesa liberada');
    } catch {
      this.toast.error('No se pudo liberar la mesa');
    }
  }

  setTab(tab: 'tables' | 'layout'): void {
    this.activeTab.set(tab);
    if (tab === 'layout') {
      this.resetDraft();
      return;
    }
    if (this.store.floorPlan().floors === 1) {
      this.activeFloor.set(1);
    }
  }

  setActiveFloor(floor: number): void {
    const maxFloor =
      this.activeTab() === 'layout' ? this.draftPlan().floors : this.store.floorPlan().floors;
    const next = Math.min(Math.max(floor, 1), Math.max(maxFloor, 1));
    this.activeFloor.set(next);
  }

  floorList(count: number): number[] {
    const safeCount = Math.max(1, Math.floor(count));
    return Array.from({ length: safeCount }, (_, index) => index + 1);
  }

  gridStyle(plan: FloorPlan): Record<string, string> {
    const grid = plan.grid;
    const cellSize = Math.max(48, Math.min(plan.cellSize, 120));
    const zoom = Math.max(0.6, Math.min(plan.zoom, 1.6));
    return {
      gridTemplateColumns: `repeat(${grid.columns}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${grid.rows}, ${cellSize}px)`,
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    };
  }


  gridCells(grid: TableGrid): Array<{ x: number; y: number }> {
    return Array.from({ length: grid.columns * grid.rows }, (_, index) => ({
      x: index % grid.columns,
      y: Math.floor(index / grid.columns),
    }));
  }


  tableStyle(position: TablePosition): Record<string, string> {
    return {
      gridColumn: `${position.x + 1}`,
      gridRow: `${position.y + 1}`,
      zIndex: '10',
    };
  }

  addFloor(): void {
    const plan = this.draftPlan();
    this.draftPlan.set({ ...plan, floors: plan.floors + 1 });
    this.activeFloor.set(plan.floors + 1);
  }

  removeFloor(): void {
    const plan = this.draftPlan();
    if (plan.floors <= 1) {
      return;
    }
    const nextFloors = plan.floors - 1;
    const nextPlan = sanitizePlan({ ...plan, floors: nextFloors });
    this.draftPlan.set(nextPlan);
    if (this.activeFloor() > nextFloors) {
      this.activeFloor.set(nextFloors);
    }
  }

  setGridSize(axis: 'columns' | 'rows', event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const raw = input ? Number(input.value) : Number.NaN;
    const value = Number.isNaN(raw) ? 1 : Math.min(Math.max(raw, 2), 20);
    const plan = this.draftPlan();
    const grid = {
      ...plan.grid,
      [axis]: value,
    };
    this.draftPlan.set(sanitizePlan({ ...plan, grid }));
  }


  resetDraft(): void {
    this.draftPlan.set(clonePlan(this.store.floorPlan()));
    this.selectedTableId.set(null);
    this.activeFloor.set(1);
  }

  async saveDraft(): Promise<void> {
    if (this.store.tables().length === 0 || this.draftPlan().positions.length === 0) {
      this.toast.error('Configura al menos 1 mesa antes de guardar');
      return;
    }
    try {
      await this.store.setFloorPlan(sanitizePlan(this.draftPlan()));
      const maxFloor = Math.max(1, this.draftPlan().floors);
      if (this.activeFloor() > maxFloor) {
        this.activeFloor.set(maxFloor);
      }
      this.toast.success('Croquis guardado');
    } catch {
      this.toast.error('No se pudo guardar el croquis');
    }
  }

  selectTable(tableId: string): void {
    this.selectedTableId.set(tableId);
  }

  cellHasTable(x: number, y: number): boolean {
    const plan = this.draftPlan();
    return Boolean(
      plan.positions.find(
        (pos) => pos.floor === this.activeFloor() && pos.x === x && pos.y === y,
      ),
    );
  }

  handleCellClick(x: number, y: number): void {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    const selected = this.selectedTableId();
    const existing = plan.positions.find(
      (pos) => pos.floor === floor && pos.x === x && pos.y === y,
    );

    if (selected) {
      this.placeTableAt(selected, x, y);
      return;
    }

    if (existing) {
      this.draftPlan.set({
        ...plan,
        positions: plan.positions.filter((pos) => pos.tableId !== existing.tableId),
      });
    }
  }

  handleTableDragStart(event: DragEvent, tableId: string): void {
    event.dataTransfer?.setData('text/plain', tableId);
    this.selectedTableId.set(tableId);
  }

  handleCellDragOver(event: DragEvent, x: number, y: number): void {
    event.preventDefault();
  }

  handleCellDrop(event: DragEvent, x: number, y: number): void {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    const tableId = data?.trim();
    if (!tableId) {
      return;
    }
    this.placeTableAt(tableId, x, y);
  }

  async addTable(): Promise<void> {
    try {
      const created = await this.store.addTable();
      if (created) {
        this.selectedTableId.set(created.id);
      }
      this.toast.success('Mesa agregada');
    } catch {
      this.toast.error('No se pudo agregar la mesa');
    }
  }

  async removeTable(tableId: string): Promise<void> {
    try {
      await this.store.deleteTable(tableId);
      const plan = this.draftPlan();
      this.draftPlan.set({
        ...plan,
        positions: plan.positions.filter((position) => position.tableId !== tableId),
      });
      if (this.selectedTableId() === tableId) {
        this.selectedTableId.set(null);
      }
      this.toast.success('Mesa eliminada');
    } catch {
      this.toast.error('No se pudo eliminar la mesa');
    }
  }

  placeTableAt(tableId: string, x: number, y: number): void {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    if (!this.store.tables().some((table) => table.id === tableId)) {
      return;
    }
    const existing = plan.positions.find(
      (pos) => pos.floor === floor && pos.x === x && pos.y === y,
    );
    if (existing && existing.tableId === tableId) {
      return;
    }
    const filtered = plan.positions.filter((pos) => pos.tableId !== tableId);
    const withoutExisting = existing
      ? filtered.filter((pos) => pos.tableId !== existing.tableId)
      : filtered;
    const next: TablePosition = { tableId, floor, x, y };
    this.draftPlan.set({ ...plan, positions: [...withoutExisting, next] });
  }

  async handleTableNumberChange(event: Event, tableId: string): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const raw = input ? Number(input.value) : Number.NaN;
    if (Number.isNaN(raw) || raw <= 0) {
      this.toast.error('Numero de mesa invalido');
      this.resetTableNumberInput(tableId, input);
      return;
    }

    const exists = this.store.tables().some((table) => table.number === raw && table.id !== tableId);
    if (exists) {
      this.toast.error('Numero de mesa ya existe');
      this.resetTableNumberInput(tableId, input);
      return;
    }

    try {
      await this.store.updateTableNumber(tableId, raw);
    } catch {
      this.toast.error('No se pudo actualizar la mesa');
      this.resetTableNumberInput(tableId, input);
    }
  }

  private resetTableNumberInput(tableId: string, input: HTMLInputElement | null): void {
    const table = this.store.tables().find((item) => item.id === tableId);
    if (table && input) {
      input.value = table.number.toString();
    }
  }

  blurOnEnter(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    target?.blur();
  }

  draftPositionLabel(tableId: string): string {
    const pos = this.draftPlan().positions.find((position) => position.tableId === tableId);
    if (!pos) {
      return 'Sin ubicar';
    }
    return `Piso ${pos.floor} - (${pos.x + 1}, ${pos.y + 1})`;
  }
}

const clonePlan = (plan: FloorPlan): FloorPlan => ({
  floors: plan.floors,
  grid: { ...plan.grid },
  positions: plan.positions.map((position) => ({ ...position })),
  blocked: plan.blocked.map((cell) => ({ ...cell })),
  cellSize: plan.cellSize,
  zoom: plan.zoom,
});

const sanitizePlan = (plan: FloorPlan): FloorPlan => {
  const floors = Math.max(1, Math.floor(plan.floors));
  const columns = Math.max(2, Math.floor(plan.grid.columns));
  const rows = Math.max(2, Math.floor(plan.grid.rows));
  const cellSize = Math.max(48, Math.min(Math.floor(plan.cellSize ?? 72), 120));
  const zoomRaw = typeof plan.zoom === 'number' ? plan.zoom : 1;
  const zoom = Math.max(0.6, Math.min(zoomRaw, 1.6));
  const blocked = (plan.blocked ?? []).filter(
    (cell) =>
      cell.floor >= 1 &&
      cell.floor <= floors &&
      cell.x >= 0 &&
      cell.x < columns &&
      cell.y >= 0 &&
      cell.y < rows,
  );
  const blockedSet = new Set(blocked.map((cell) => `${cell.floor}:${cell.x}:${cell.y}`));
  const positions = plan.positions.filter(
    (position) =>
      position.floor >= 1 &&
      position.floor <= floors &&
      position.x >= 0 &&
      position.x < columns &&
      position.y >= 0 &&
      position.y < rows &&
      !blockedSet.has(`${position.floor}:${position.x}:${position.y}`),
  );
  return {
    floors,
    grid: { columns, rows },
    positions,
    blocked,
    cellSize,
    zoom,
  };
};

