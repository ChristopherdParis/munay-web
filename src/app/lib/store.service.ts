import { Injectable, computed, effect, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  FloorPlan,
  MenuItem,
  Order,
  OrderItem,
  PaymentStatus,
  PaymentTiming,
  RestaurantTable,
  TablePosition,
  TableStatus,
} from './types';
import { MenuItemsService } from './menu-items.service';
import { OrdersService } from './orders.service';
import { TablesService } from './tables.service';
import { FloorPlanService } from './floor-plan.service';
import { TenantService } from './tenant.service';
import { RealtimeService } from './realtime.service';

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

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly tables = signal<RestaurantTable[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly floorPlan = signal<FloorPlan>(createDefaultFloorPlan([]));
  readonly activeRestaurantId = computed(() => this.tenant.activeRestaurantId());
  private pollTimer: number | null = null;

  constructor(
    private readonly menuItemsApi: MenuItemsService,
    private readonly ordersApi: OrdersService,
    private readonly tablesApi: TablesService,
    private readonly floorPlanApi: FloorPlanService,
    private readonly tenant: TenantService,
    private readonly realtime: RealtimeService,
  ) {
    effect(() => {
      const tenantId = this.tenant.activeRestaurantId();
      if (!tenantId) {
        this.resetState();
        this.realtime.disconnect();
        this.stopPolling();
        return;
      }
      void this.loadAll();
      this.realtime.connect(tenantId);
      this.realtime.clearHandlers();
      this.registerRealtimeHandlers();
    });

    effect(() => {
      const tenantId = this.tenant.activeRestaurantId();
      const connected = this.realtime.connected();
      if (!tenantId) {
        this.stopPolling();
        return;
      }
      if (connected) {
        this.stopPolling();
      } else {
        this.startPolling();
      }
    });
  }

  async loadAll(): Promise<void> {
    await this.loadTables();
    await Promise.all([this.loadMenuItems(), this.loadOrders()]);
    await this.loadFloorPlan();
  }

  async loadTables(): Promise<void> {
    await this.ensureTenant();
    const tables = await firstValueFrom(this.tablesApi.list());
    this.tables.set(tables);
  }

  async loadMenuItems(): Promise<void> {
    await this.ensureTenant();
    const items = await firstValueFrom(this.menuItemsApi.list());
    this.menuItems.set(items.map((item) => this.normalizeMenuItem(item)));
  }

  async loadOrders(): Promise<void> {
    await this.ensureTenant();
    const orders = await firstValueFrom(this.ordersApi.list());
    this.orders.set(orders.map((order) => this.normalizeOrder(order)));
  }

  async loadFloorPlan(): Promise<void> {
    await this.ensureTenant();
    try {
      const plan = await firstValueFrom(this.floorPlanApi.get());
      this.floorPlan.set(plan);
    } catch {
      const fallback = createDefaultFloorPlan(this.tables());
      const plan = await firstValueFrom(this.floorPlanApi.update(fallback));
      this.floorPlan.set(plan);
    }
  }

  async setTableStatus(tableId: string, status: TableStatus, orderId?: string): Promise<void> {
    await this.ensureTenant();
    const table = this.tables().find((t) => t.id === tableId);
    if (!table) {
      return;
    }
    const next = await firstValueFrom(
      this.tablesApi.update(tableId, {
        status,
        currentOrderId:
          status === 'free' || status === 'served' ? null : orderId ?? table.currentOrderId ?? null,
        paymentStatus: status === 'free' ? 'unpaid' : table.paymentStatus,
      }),
    );
    this.tables.update((tables) => tables.map((t) => (t.id === tableId ? next : t)));
  }

  async setTablePaymentTiming(tableId: string, timing: PaymentTiming): Promise<void> {
    await this.ensureTenant();
    const next = await firstValueFrom(this.tablesApi.update(tableId, { paymentTiming: timing }));
    this.tables.update((tables) => tables.map((t) => (t.id === tableId ? next : t)));
  }

  async setTablePaymentStatus(tableId: string, status: PaymentStatus): Promise<void> {
    await this.ensureTenant();
    const next = await firstValueFrom(this.tablesApi.update(tableId, { paymentStatus: status }));
    this.tables.update((tables) => tables.map((t) => (t.id === tableId ? next : t)));
  }

  async setFloorPlan(plan: FloorPlan): Promise<void> {
    await this.ensureTenant();
    const next = await firstValueFrom(this.floorPlanApi.update(plan));
    this.floorPlan.set(next);
  }

  async addTable(): Promise<RestaurantTable | null> {
    await this.ensureTenant();
    const tables = this.tables();
    const nextNumber = tables.length ? Math.max(...tables.map((table) => table.number)) + 1 : 1;
    const created = await firstValueFrom(this.tablesApi.create({ number: nextNumber }));
    this.tables.update((items) => [...items, created]);
    return created;
  }

  async deleteTable(tableId: string): Promise<void> {
    await this.ensureTenant();
    await firstValueFrom(this.tablesApi.remove(tableId));
    this.tables.update((tables) => tables.filter((table) => table.id !== tableId));
    this.floorPlan.update((plan) => ({
      ...plan,
      positions: plan.positions.filter((position) => position.tableId !== tableId),
    }));
  }

  async updateTableNumber(tableId: string, nextNumber: number): Promise<void> {
    await this.ensureTenant();
    const updated = await firstValueFrom(this.tablesApi.update(tableId, { number: nextNumber }));
    const table = this.tables().find((item) => item.id === tableId);
    const prevNumber = table?.number;
    this.tables.update((tables) => tables.map((item) => (item.id === tableId ? updated : item)));
    if (prevNumber) {
      this.orders.update((orders) =>
        orders.map((order) =>
          order.tableNumber === prevNumber ? { ...order, tableNumber: nextNumber } : order,
        ),
      );
    }
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<void> {
    await this.ensureTenant();
    const created = await firstValueFrom(this.menuItemsApi.create(item));
    this.menuItems.update((items) => [...items, this.normalizeMenuItem(created)]);
  }

  async updateMenuItem(item: MenuItem): Promise<void> {
    await this.ensureTenant();
    const updated = await firstValueFrom(
      this.menuItemsApi.update(item.id, {
        name: item.name,
        category: item.category,
        price: item.price,
        isAvailable: item.isAvailable,
      }),
    );
    this.menuItems.update((items) =>
      items.map((m) => (m.id === item.id ? this.normalizeMenuItem(updated) : m)),
    );
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.ensureTenant();
    await firstValueFrom(this.menuItemsApi.remove(id));
    this.menuItems.update((items) => items.filter((m) => m.id !== id));
  }

  async submitOrder(tableNumber: number, items: OrderItem[]): Promise<void> {
    await this.ensureTenant();
    const payloadItems = items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    }));
    const order = await firstValueFrom(
      this.ordersApi.create({
        tableNumber,
        items: payloadItems,
      }),
    );
    this.orders.update((orders) => [this.normalizeOrder(order), ...orders]);
    await this.loadTables();
  }

  async markOrderReady(orderId: string): Promise<void> {
    await this.ensureTenant();
    const order = await firstValueFrom(this.ordersApi.updateStatus(orderId, { status: 'ready' }));
    this.replaceOrder(order);
  }

  async markOrderPending(orderId: string): Promise<void> {
    await this.ensureTenant();
    const order = await firstValueFrom(this.ordersApi.updateStatus(orderId, { status: 'pending' }));
    this.replaceOrder(order);
  }

  async markOrderServed(orderId: string): Promise<void> {
    await this.ensureTenant();
    const order = await firstValueFrom(
      this.ordersApi.updateStatus(orderId, { status: 'delivered' }),
    );
    this.replaceOrder(order);
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.ensureTenant();
    const order = await firstValueFrom(
      this.ordersApi.updateStatus(orderId, { status: 'cancelled' }),
    );
    this.replaceOrder(order);
    await this.refreshTablePaymentStatus(order.tableNumber);
  }

  async markOrderPaid(orderId: string): Promise<void> {
    await this.ensureTenant();
    const order = await firstValueFrom(this.ordersApi.updatePaid(orderId, { paid: true }));
    this.replaceOrder(order);
    await this.refreshTablePaymentStatus(order.tableNumber);
  }

  async markOrdersPaidForTable(tableNumber: number): Promise<void> {
    const orders = this.orders().filter(
      (o) => o.tableNumber === tableNumber && o.status !== 'cancelled',
    );
    for (const order of orders) {
      if (!order.paid) {
        await this.markOrderPaid(order.id);
      }
    }
  }

  canReleaseTable(tableNumber: number): boolean {
    return this.orders()
      .filter((o) => o.tableNumber === tableNumber && o.status !== 'cancelled')
      .every((o) => o.paid);
  }

  async releaseTable(tableId: string): Promise<void> {
    await this.ensureTenant();
    const table = this.tables().find((t) => t.id === tableId);
    if (!table) {
      return;
    }
    const updated = await firstValueFrom(
      this.tablesApi.update(tableId, {
        status: 'free',
        currentOrderId: null,
        paymentStatus: 'unpaid',
        paymentTiming: 'end',
      }),
    );
    this.tables.update((tables) => tables.map((t) => (t.id === tableId ? updated : t)));
  }

  private async refreshTablePaymentStatus(tableNumber: number): Promise<void> {
    const table = this.tables().find((t) => t.number === tableNumber);
    if (!table) {
      return;
    }
    const tableOrders = this.orders().filter(
      (o) => o.tableNumber === tableNumber && o.status !== 'cancelled',
    );
    const hasUnpaid = tableOrders.some((o) => !o.paid);
    const nextStatus: PaymentStatus =
      tableOrders.length === 0 ? 'unpaid' : hasUnpaid ? 'unpaid' : 'paid';
    await this.setTablePaymentStatus(table.id, nextStatus);
  }

  private replaceOrder(order: Order): void {
    const normalized = this.normalizeOrder(order);
    this.orders.update((orders) =>
      orders.map((o) => (o.id === normalized.id ? normalized : o)),
    );
  }

  private normalizeMenuItem(item: MenuItem): MenuItem {
    return {
      ...item,
      price: Number(item.price),
    };
  }

  private normalizeOrder(order: Order): Order {
    return {
      ...order,
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        menuItemId: item.menuItemId ?? item.menuItem?.id ?? '',
        unitPrice: Number(item.unitPrice),
        menuItem: item.menuItem ? this.normalizeMenuItem(item.menuItem) : item.menuItem,
      })),
    };
  }

  private resetState(): void {
    this.tables.set([]);
    this.menuItems.set([]);
    this.orders.set([]);
    this.floorPlan.set(createDefaultFloorPlan([]));
  }

  private async ensureTenant(): Promise<string> {
    const tenantId = this.tenant.activeRestaurantId();
    if (!tenantId) {
      throw new Error('Missing active restaurant');
    }
    return tenantId;
  }

  private registerRealtimeHandlers(): void {
    this.realtime.on('order.created', () => {
      void this.loadOrders();
      void this.loadTables();
    });
    this.realtime.on('order.updated', () => {
      void this.loadOrders();
      void this.loadTables();
    });
    this.realtime.on('order.deleted', () => {
      void this.loadOrders();
      void this.loadTables();
    });
    this.realtime.on('menu-item.created', () => {
      void this.loadMenuItems();
    });
    this.realtime.on('menu-item.updated', () => {
      void this.loadMenuItems();
    });
    this.realtime.on('menu-item.deleted', () => {
      void this.loadMenuItems();
    });
    this.realtime.on('table.created', () => {
      void this.loadTables();
    });
    this.realtime.on('table.updated', () => {
      void this.loadTables();
    });
    this.realtime.on('table.deleted', () => {
      void this.loadTables();
      void this.loadFloorPlan();
    });
    this.realtime.on('floor-plan.updated', () => {
      void this.loadFloorPlan();
    });
  }

  private startPolling(): void {
    if (this.pollTimer !== null) {
      return;
    }
    this.pollTimer = window.setInterval(() => {
      void this.loadOrders();
      void this.loadTables();
    }, 15000);
  }

  private stopPolling(): void {
    if (this.pollTimer === null) {
      return;
    }
    window.clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
}
