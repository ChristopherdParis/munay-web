import { Injectable, signal } from '@angular/core';
import { defaultMenuItems, defaultTables } from './data';
import {
  FloorPlan,
  MenuItem,
  Order,
  OrderItem,
  RestaurantTable,
  TableStatus,
  TablePosition,
} from './types';

const FLOOR_PLAN_STORAGE_KEY = 'orderflow.floorPlan';
const DEFAULT_GRID = { columns: 6, rows: 4 };
const DEFAULT_CELL_SIZE = 72;
const DEFAULT_ZOOM = 1;

const createDefaultFloorPlan = (tables: RestaurantTable[]): FloorPlan => {
  const positions: TablePosition[] = tables.map((table, index) => ({
    tableId: table.id,
    floor: 1,
    x: index % DEFAULT_GRID.columns,
    y: Math.floor(index / DEFAULT_GRID.columns),
  }));

  return {
    floors: 1,
    grid: { ...DEFAULT_GRID },
    positions,
    blocked: [],
    cellSize: DEFAULT_CELL_SIZE,
    zoom: DEFAULT_ZOOM,
  };
};

const loadFloorPlan = (tables: RestaurantTable[]): FloorPlan => {
  if (typeof window === 'undefined') {
    return createDefaultFloorPlan(tables);
  }

  const raw = window.localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  if (!raw) {
    return createDefaultFloorPlan(tables);
  }

  try {
    const parsed = JSON.parse(raw) as FloorPlan;
    if (
      !parsed ||
      !parsed.grid ||
      !Array.isArray(parsed.positions) ||
      typeof parsed.floors !== 'number'
    ) {
      return createDefaultFloorPlan(tables);
    }
    return {
      ...parsed,
      blocked: Array.isArray(parsed.blocked) ? parsed.blocked : [],
      cellSize:
        typeof parsed.cellSize === 'number' ? parsed.cellSize : DEFAULT_CELL_SIZE,
      zoom: typeof parsed.zoom === 'number' ? parsed.zoom : DEFAULT_ZOOM,
    };
  } catch {
    return createDefaultFloorPlan(tables);
  }
};

const persistFloorPlan = (plan: FloorPlan): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(plan));
};

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly tables = signal<RestaurantTable[]>(defaultTables);
  readonly menuItems = signal<MenuItem[]>(defaultMenuItems);
  readonly orders = signal<Order[]>([]);
  readonly floorPlan = signal<FloorPlan>(loadFloorPlan(defaultTables));

  setTableStatus(tableId: number, status: TableStatus, orderId?: string): void {
    this.tables.update((tables) =>
      tables.map((table) =>
        table.id === tableId ? { ...table, status, currentOrderId: orderId } : table,
      ),
    );
  }

  setFloorPlan(plan: FloorPlan): void {
    this.floorPlan.set(plan);
    persistFloorPlan(plan);
  }

  addTable(): void {
    const tables = this.tables();
    const nextId = tables.length ? Math.max(...tables.map((table) => table.id)) + 1 : 1;
    const nextNumber = tables.length ? Math.max(...tables.map((table) => table.number)) + 1 : 1;
    this.tables.set([...tables, { id: nextId, number: nextNumber, status: 'free' }]);
  }

  deleteTable(tableId: number): void {
    this.tables.update((tables) => tables.filter((table) => table.id !== tableId));
    this.floorPlan.update((plan) => {
      const nextPlan = {
        ...plan,
        positions: plan.positions.filter((position) => position.tableId !== tableId),
      };
      persistFloorPlan(nextPlan);
      return nextPlan;
    });
  }

  updateTableNumber(tableId: number, nextNumber: number): void {
    const table = this.tables().find((item) => item.id === tableId);
    if (!table) {
      return;
    }
    const prevNumber = table.number;
    this.tables.update((tables) =>
      tables.map((item) => (item.id === tableId ? { ...item, number: nextNumber } : item)),
    );
    this.orders.update((orders) =>
      orders.map((order) =>
        order.tableNumber === prevNumber ? { ...order, tableNumber: nextNumber } : order,
      ),
    );
  }

  addMenuItem(item: Omit<MenuItem, 'id'>): void {
    this.menuItems.update((items) => [...items, { ...item, id: crypto.randomUUID() }]);
  }

  updateMenuItem(item: MenuItem): void {
    this.menuItems.update((items) => items.map((m) => (m.id === item.id ? item : m)));
  }

  deleteMenuItem(id: string): void {
    this.menuItems.update((items) => items.filter((m) => m.id !== id));
  }

  submitOrder(tableNumber: number, items: OrderItem[]): void {
    const total = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const order: Order = {
      id: crypto.randomUUID(),
      tableNumber,
      items,
      status: 'pending',
      createdAt: new Date(),
      total,
    };
    this.orders.update((orders) => [order, ...orders]);
    this.tables.update((tables) =>
      tables.map((table) =>
        table.number === tableNumber
          ? { ...table, status: 'occupied', currentOrderId: order.id }
          : table,
      ),
    );
  }

  markOrderReady(orderId: string): void {
    this.orders.update((orders) =>
      orders.map((order) => (order.id === orderId ? { ...order, status: 'ready' } : order)),
    );
  }

  markOrderServed(orderId: string): void {
    const order = this.orders().find((o) => o.id === orderId);
    this.orders.update((orders) =>
      orders.map((o) => (o.id === orderId ? { ...o, status: 'served' } : o)),
    );
    if (order) {
      this.tables.update((tables) =>
        tables.map((table) =>
          table.number === order.tableNumber
            ? { ...table, status: 'free', currentOrderId: undefined }
            : table,
        ),
      );
    }
  }
}
