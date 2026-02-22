export type TableStatus = 'free' | 'ordering' | 'occupied';

export interface RestaurantTable {
  id: number;
  number: number;
  status: TableStatus;
  currentOrderId?: string;
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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  total: number;
}
