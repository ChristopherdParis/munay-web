import { MenuItem, RestaurantTable } from './types';

export const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Bruschetta', price: 8.5, category: 'Starters' },
  { id: '2', name: 'Caesar Salad', price: 10.0, category: 'Starters' },
  { id: '3', name: 'Soup of the Day', price: 7.0, category: 'Starters' },
  { id: '4', name: 'Grilled Salmon', price: 22.0, category: 'Mains' },
  { id: '5', name: 'Ribeye Steak', price: 28.0, category: 'Mains' },
  { id: '6', name: 'Chicken Parmesan', price: 18.0, category: 'Mains' },
  { id: '7', name: 'Margherita Pizza', price: 14.0, category: 'Mains' },
  { id: '8', name: 'Pasta Carbonara', price: 16.0, category: 'Mains' },
  { id: '9', name: 'Tiramisu', price: 9.0, category: 'Desserts' },
  { id: '10', name: 'Chocolate Lava Cake', price: 10.0, category: 'Desserts' },
  { id: '11', name: 'Espresso', price: 3.5, category: 'Drinks' },
  { id: '12', name: 'Fresh Juice', price: 5.0, category: 'Drinks' },
  { id: '13', name: 'House Wine (glass)', price: 8.0, category: 'Drinks' },
  { id: '14', name: 'Sparkling Water', price: 3.0, category: 'Drinks' },
];

export const defaultTables: RestaurantTable[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  status: 'free',
}));
