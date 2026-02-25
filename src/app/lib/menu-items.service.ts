import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from './types';
import { getApiBaseUrl } from './api-config';

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number;
}

export interface UpdateMenuItemPayload {
  name?: string;
  category?: string;
  price?: number;
  isAvailable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuItemsService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu-items`);
  }

  create(payload: CreateMenuItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.baseUrl}/menu-items`, payload);
  }

  update(id: string, payload: UpdateMenuItemPayload): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${this.baseUrl}/menu-items/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/menu-items/${id}`);
  }
}
