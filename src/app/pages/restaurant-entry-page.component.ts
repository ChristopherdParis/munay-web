import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantsService } from '../lib/restaurants.service';
import { TenantService } from '../lib/tenant.service';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-restaurant-entry-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-10">
      <div class="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Cargando negocio...
      </div>
    </div>
  `,
})
export class RestaurantEntryPageComponent {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly restaurantsService: RestaurantsService,
    private readonly tenant: TenantService,
    private readonly toast: ToastService,
  ) {
    void this.resolveTenant();
  }

  private async resolveTenant(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug')?.trim();
    if (!slug) {
      this.toast.error('Slug inválido');
      await this.router.navigate(['/restaurants']);
      return;
    }
    try {
      const restaurant = await firstValueFrom(this.restaurantsService.getBySlug(slug));
      this.tenant.setActiveRestaurant(restaurant.id, restaurant.name);
      await this.router.navigate(['/']);
    } catch {
      this.toast.error('No se encontró el negocio');
      await this.router.navigate(['/restaurants']);
    }
  }
}
