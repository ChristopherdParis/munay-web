import { Routes } from '@angular/router';
import { TablesPageComponent } from './pages/tables-page.component';
import { OrderPageComponent } from './pages/order-page.component';
import { KitchenPageComponent } from './pages/kitchen-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { OrderHistoryPageComponent } from './pages/order-history-page.component';
import { NotFoundComponent } from './pages/not-found.component';
import { RestaurantsPageComponent } from './pages/restaurants-page.component';
import { RestaurantEntryPageComponent } from './pages/restaurant-entry-page.component';

export const routes: Routes = [
  { path: '', component: TablesPageComponent, pathMatch: 'full' },
  { path: 'order/:tableNumber', component: OrderPageComponent },
  { path: 'kitchen', component: KitchenPageComponent },
  { path: 'r/:slug', component: RestaurantEntryPageComponent },
  { path: 'restaurants', component: RestaurantsPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: 'history', component: OrderHistoryPageComponent },
  { path: '**', component: NotFoundComponent },
];
