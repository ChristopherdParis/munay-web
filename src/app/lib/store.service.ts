import { Injectable, signal } from '@angular/core';
import { defaultMenuItems, defaultTables } from './data';
import { MenuItem, Order, OrderItem, RestaurantTable, TableStatus } from './types';

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly tables = signal<RestaurantTable[]>(defaultTables);
  readonly menuItems = signal<MenuItem[]>(defaultMenuItems);
  readonly orders = signal<Order[]>([]);

  setTableStatus(tableId: number, status: TableStatus, orderId?: string): void {
    this.tables.update((tables) =>
      tables.map((table) =>
        table.id === tableId ? { ...table, status, currentOrderId: orderId } : table,
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
