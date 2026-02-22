export type TableStatus = 'free' | 'seated' | 'ordered' | 'served';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentTiming = 'start' | 'end';

export interface RestaurantTable {
  id: number;
  number: number;
  status: TableStatus;
  paymentStatus: PaymentStatus;
  paymentTiming: PaymentTiming;
  currentOrderId?: string;
}

export interface TablePosition {
  tableId: number;
  floor: number;
  x: number;
  y: number;
}

export interface TableGrid {
  columns: number;
  rows: number;
}

export interface BlockedCell {
  floor: number;
  x: number;
  y: number;
}

export interface FloorPlan {
  floors: number;
  grid: TableGrid;
  positions: TablePosition[];
  blocked: BlockedCell[];
  cellSize: number;
  zoom: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'canceled';

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  total: number;
  paymentTiming: PaymentTiming;
  paid: boolean;
}
