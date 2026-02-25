export type TableStatus = 'free' | 'seated' | 'ordered' | 'served';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentTiming = 'start' | 'end';

export interface RestaurantTable {
  id: string;
  number: number;
  status: TableStatus;
  paymentStatus: PaymentStatus;
  paymentTiming: PaymentTiming;
  currentOrderId?: string;
}

export interface TablePosition {
  tableId: string;
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
  category: string;
  price: number;
  isAvailable?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem?: MenuItem;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  total: number;
  paymentTiming: PaymentTiming;
  paid: boolean;
}
