import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TenantService } from './tenant.service';

export const tenantGuard: CanActivateFn = () => {
  const tenant = inject(TenantService);
  const router = inject(Router);

  if (tenant.activeRestaurantId()) {
    return true;
  }

  router.navigate(['/select']);
  return false;
};
