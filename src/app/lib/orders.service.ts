import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from './types';
import { getApiBaseUrl } from './api-config';

export interface CreateOrderItemPayload {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  tableNumber: number;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderStatusPayload {
  status: Order['status'];
}

export interface UpdateOrderPaidPayload {
  paid: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, payload);
  }

  updateStatus(id: string, payload: UpdateOrderStatusPayload): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/orders/${id}/status`, payload);
  }

  updatePaid(id: string, payload: UpdateOrderPaidPayload): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/orders/${id}/paid`, payload);
  }
}
