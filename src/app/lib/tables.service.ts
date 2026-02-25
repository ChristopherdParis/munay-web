import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestaurantTable } from './types';
import { getApiBaseUrl } from './api-config';

export interface CreateTablePayload {
  number: number;
  status?: RestaurantTable['status'];
  paymentTiming?: RestaurantTable['paymentTiming'];
}

export interface UpdateTablePayload {
  number?: number;
  status?: RestaurantTable['status'];
  paymentStatus?: RestaurantTable['paymentStatus'];
  paymentTiming?: RestaurantTable['paymentTiming'];
  currentOrderId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TablesService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(`${this.baseUrl}/tables`);
  }

  create(payload: CreateTablePayload): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(`${this.baseUrl}/tables`, payload);
  }

  update(id: string, payload: UpdateTablePayload): Observable<RestaurantTable> {
    return this.http.patch<RestaurantTable>(`${this.baseUrl}/tables/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/tables/${id}`);
  }
}
