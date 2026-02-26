import { Routes } from '@angular/router';
import { TablesPageComponent } from './pages/tables-page.component';
import { OrderPageComponent } from './pages/order-page.component';
import { KitchenPageComponent } from './pages/kitchen-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { OrderHistoryPageComponent } from './pages/order-history-page.component';
import { NotFoundComponent } from './pages/not-found.component';
import { RestaurantEntryPageComponent } from './pages/restaurant-entry-page.component';
import { SelectRestaurantPageComponent } from './pages/select-restaurant-page.component';
import { OwnerLayoutComponent } from './pages/owner-layout.component';
import { OwnerDashboardComponent } from './pages/owner-dashboard.component';
import { OwnerRestaurantsComponent } from './pages/owner-restaurants.component';
import { OwnerRestaurantHistoryComponent } from './pages/owner-restaurant-history.component';
import { tenantGuard } from './lib/tenant.guard';

export const routes: Routes = [
  { path: '', component: TablesPageComponent, pathMatch: 'full', canActivate: [tenantGuard] },
  { path: 'order/:tableNumber', component: OrderPageComponent, canActivate: [tenantGuard] },
  { path: 'kitchen', component: KitchenPageComponent, canActivate: [tenantGuard] },
  { path: 'r/:slug', component: RestaurantEntryPageComponent },
  { path: 'select', component: SelectRestaurantPageComponent },
  { path: 'admin', component: AdminPageComponent, canActivate: [tenantGuard] },
  { path: 'history', component: OrderHistoryPageComponent, canActivate: [tenantGuard] },
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    children: [
      { path: '', component: OwnerDashboardComponent },
      { path: 'restaurants', component: OwnerRestaurantsComponent },
      { path: 'restaurants/:id/history', component: OwnerRestaurantHistoryComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
