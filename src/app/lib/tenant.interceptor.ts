import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from './tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);
  const tenantId = tenantService.activeRestaurantId();
  if (!tenantId) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        'x-restaurant-id': tenantId,
      },
    }),
  );
};
