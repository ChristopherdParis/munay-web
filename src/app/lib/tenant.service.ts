import { Injectable, signal } from '@angular/core';

const TENANT_STORAGE_KEY = 'activeRestaurantId';
const TENANT_NAME_KEY = 'activeRestaurantName';

@Injectable({ providedIn: 'root' })
export class TenantService {
  readonly activeRestaurantId = signal<string | null>(this.load());
  readonly activeRestaurantName = signal<string | null>(this.loadName());

  setActiveRestaurantId(id: string): void {
    this.activeRestaurantId.set(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TENANT_STORAGE_KEY, id);
    }
  }

  setActiveRestaurant(id: string, name: string): void {
    this.activeRestaurantId.set(id);
    this.activeRestaurantName.set(name);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TENANT_STORAGE_KEY, id);
      window.localStorage.setItem(TENANT_NAME_KEY, name);
    }
  }

  clear(): void {
    this.activeRestaurantId.set(null);
    this.activeRestaurantName.set(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TENANT_STORAGE_KEY);
      window.localStorage.removeItem(TENANT_NAME_KEY);
    }
  }

  private load(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const value = window.localStorage.getItem(TENANT_STORAGE_KEY);
    return value && value.trim().length > 0 ? value : null;
  }

  private loadName(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const value = window.localStorage.getItem(TENANT_NAME_KEY);
    return value && value.trim().length > 0 ? value : null;
  }
}
