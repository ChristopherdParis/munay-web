import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '../lib/store.service';
import { FloorPlan, RestaurantTable, TableGrid, TablePosition, TableStatus } from '../lib/types';
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
                class="rounded-lg border border-dashed border-border/80 bg-muted/50"
                [ngClass]="
                  cellIsBlocked(store.floorPlan(), cell.x, cell.y, activeFloor())
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-muted/50'
                "
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
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Celdas:</span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="48"
                max="120"
                class="w-20 rounded-md border bg-card px-2 py-1 text-sm text-foreground"
                [value]="draftPlan().cellSize"
                (change)="setCellSize($event)"
              />
              <span class="text-xs text-muted-foreground">px</span>
            </div>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="0.6"
                max="1.6"
                step="0.1"
                class="w-20 rounded-md border bg-card px-2 py-1 text-sm text-foreground"
                [value]="draftPlan().zoom"
                (change)="setZoom($event)"
              />
              <span class="text-xs text-muted-foreground">Zoom</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Modo:</span>
            <div class="inline-flex rounded-lg border bg-card p-1">
              <button
                class="touch-target rounded-md px-3 py-1 text-sm font-medium"
                [ngClass]="layoutMode() === 'place' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
                (click)="layoutMode.set('place')"
              >
                Ubicar mesas
              </button>
              <button
                class="touch-target rounded-md px-3 py-1 text-sm font-medium"
                [ngClass]="layoutMode() === 'shape' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
                (click)="layoutMode.set('shape')"
              >
                Editar celdas
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Plantillas:</span>
            <div class="inline-flex flex-wrap rounded-lg border bg-card p-1">
              <button
                class="touch-target rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                (click)="applyTemplate('rectangle')"
              >
                Rectangulo
              </button>
              <button
                class="touch-target rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                (click)="applyTemplate('l')"
              >
                Forma L
              </button>
              <button
                class="touch-target rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                (click)="applyTemplate('u')"
              >
                Forma U
              </button>
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
                class="rounded-lg border border-dashed border-border/80 bg-muted/50 transition hover:border-primary/70"
                [ngClass]="
                  cellIsBlocked(draftPlan(), cell.x, cell.y, activeFloor())
                    ? 'bg-destructive/10 border-destructive/30'
                    : cellHasTable(cell.x, cell.y)
                      ? 'bg-primary/10'
                      : 'bg-muted/50'
                "
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
  readonly activeTab = signal<'tables' | 'layout'>('tables');
  readonly activeFloor = signal(1);
  readonly selectedTableId = signal<number | null>(null);
  readonly layoutMode = signal<'place' | 'shape'>('place');
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
  }

  goToOrder(tableNumber: number): void {
    this.router.navigate(['/order', tableNumber]);
  }

  cycleStatus(table: RestaurantTable, event?: Event): void {
    event?.stopPropagation();
    const order: TableStatus[] = ['free', 'seated', 'ordered', 'served'];
    const currentIndex = order.indexOf(table.status);
    const nextStatus = order[(currentIndex + 1) % order.length] ?? 'free';
    this.store.setTableStatus(table.id, nextStatus);
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

  setCellSize(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const raw = input ? Number(input.value) : Number.NaN;
    const value = Number.isNaN(raw) ? 72 : Math.min(Math.max(raw, 48), 120);
    const plan = this.draftPlan();
    this.draftPlan.set({ ...plan, cellSize: value });
  }

  setZoom(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const raw = input ? Number(input.value) : Number.NaN;
    const value = Number.isNaN(raw) ? 1 : Math.min(Math.max(raw, 0.6), 1.6);
    const plan = this.draftPlan();
    this.draftPlan.set({ ...plan, zoom: value });
  }

  gridCells(grid: TableGrid): Array<{ x: number; y: number }> {
    return Array.from({ length: grid.columns * grid.rows }, (_, index) => ({
      x: index % grid.columns,
      y: Math.floor(index / grid.columns),
    }));
  }

  cellIsBlocked(plan: FloorPlan, x: number, y: number, floor: number): boolean {
    return plan.blocked.some((cell) => cell.floor === floor && cell.x === x && cell.y === y);
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

  applyTemplate(template: 'rectangle' | 'l' | 'u'): void {
    const plan = this.draftPlan();
    const grid = plan.grid;
    const floor = this.activeFloor();
    const blocked = plan.blocked.filter((cell) => cell.floor !== floor);
    const next: Array<{ floor: number; x: number; y: number }> = [];

    this.layoutMode.set('shape');
    this.selectedTableId.set(null);

    if (template === 'rectangle') {
      this.draftPlan.set(sanitizePlan({ ...plan, blocked }));
      this.toast.success('Plantilla aplicada');
      return;
    }

    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.columns; x += 1) {
        const isLeft = x === 0;
        const isRight = x === grid.columns - 1;
        const isBottom = y === grid.rows - 1;
        const keep =
          template === 'l'
            ? isLeft || isBottom
            : isLeft || isRight || isBottom;
        if (!keep) {
          next.push({ floor, x, y });
        }
      }
    }

    this.draftPlan.set(sanitizePlan({ ...plan, blocked: [...blocked, ...next] }));
    this.toast.success('Plantilla aplicada');
  }

  resetDraft(): void {
    this.draftPlan.set(clonePlan(this.store.floorPlan()));
    this.selectedTableId.set(null);
    this.activeFloor.set(1);
    this.layoutMode.set('place');
  }

  saveDraft(): void {
    if (this.store.tables().length === 0 || this.draftPlan().positions.length === 0) {
      this.toast.error('Configura al menos 1 mesa antes de guardar');
      return;
    }
    this.store.setFloorPlan(sanitizePlan(this.draftPlan()));
    const maxFloor = Math.max(1, this.draftPlan().floors);
    if (this.activeFloor() > maxFloor) {
      this.activeFloor.set(maxFloor);
    }
    this.toast.success('Croquis guardado');
  }

  selectTable(tableId: number): void {
    this.selectedTableId.set(tableId);
    this.layoutMode.set('place');
  }

  cellHasTable(x: number, y: number): boolean {
    const plan = this.draftPlan();
    if (this.cellIsBlocked(plan, x, y, this.activeFloor())) {
      return false;
    }
    return Boolean(
      plan.positions.find(
        (pos) => pos.floor === this.activeFloor() && pos.x === x && pos.y === y,
      ),
    );
  }

  handleCellClick(x: number, y: number): void {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    if (this.layoutMode() === 'shape') {
      this.toggleBlockedCell(x, y);
      return;
    }
    if (this.cellIsBlocked(plan, x, y, floor)) {
      return;
    }
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

  handleTableDragStart(event: DragEvent, tableId: number): void {
    event.dataTransfer?.setData('text/plain', tableId.toString());
    this.selectedTableId.set(tableId);
    this.layoutMode.set('place');
  }

  handleCellDragOver(event: DragEvent, x: number, y: number): void {
    if (this.layoutMode() !== 'place') {
      return;
    }
    if (this.cellIsBlocked(this.draftPlan(), x, y, this.activeFloor())) {
      return;
    }
    event.preventDefault();
  }

  handleCellDrop(event: DragEvent, x: number, y: number): void {
    if (this.layoutMode() !== 'place') {
      return;
    }
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    const tableId = data ? Number(data) : Number.NaN;
    if (Number.isNaN(tableId)) {
      return;
    }
    this.placeTableAt(tableId, x, y);
  }

  addTable(): void {
    this.store.addTable();
    const tables = this.store.tables();
    const newest = tables[tables.length - 1];
    if (newest) {
      this.selectedTableId.set(newest.id);
    }
    this.toast.success('Mesa agregada');
  }

  removeTable(tableId: number): void {
    this.store.deleteTable(tableId);
    const plan = this.draftPlan();
    this.draftPlan.set({
      ...plan,
      positions: plan.positions.filter((position) => position.tableId !== tableId),
    });
    if (this.selectedTableId() === tableId) {
      this.selectedTableId.set(null);
    }
    this.toast.success('Mesa eliminada');
  }

  toggleBlockedCell(x: number, y: number): void {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    const exists = this.cellIsBlocked(plan, x, y, floor);
    const nextBlocked = exists
      ? plan.blocked.filter((cell) => !(cell.floor === floor && cell.x === x && cell.y === y))
      : [...plan.blocked, { floor, x, y }];
    this.draftPlan.set(sanitizePlan({ ...plan, blocked: nextBlocked }));
  }

  placeTableAt(tableId: number, x: number, y: number): void {
    const plan = this.draftPlan();
    const floor = this.activeFloor();
    if (!this.store.tables().some((table) => table.id === tableId)) {
      return;
    }
    if (this.cellIsBlocked(plan, x, y, floor)) {
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

  handleTableNumberChange(event: Event, tableId: number): void {
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

    this.store.updateTableNumber(tableId, raw);
  }

  private resetTableNumberInput(tableId: number, input: HTMLInputElement | null): void {
    const table = this.store.tables().find((item) => item.id === tableId);
    if (table && input) {
      input.value = table.number.toString();
    }
  }

  blurOnEnter(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    target?.blur();
  }

  draftPositionLabel(tableId: number): string {
    const pos = this.draftPlan().positions.find((position) => position.tableId === tableId);
    if (!pos) {
      return 'Sin ubicar';
    }
    return `Piso ${pos.floor} · (${pos.x + 1}, ${pos.y + 1})`;
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
