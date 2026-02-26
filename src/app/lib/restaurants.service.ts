import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant } from './types';
import { getApiBaseUrl } from './api-config';

export interface CreateRestaurantPayload {
  name: string;
  slug: string;
}

export interface UpdateRestaurantPayload {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RestaurantsService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants`);
  }

  findOne(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/${id}`);
  }

  getBySlug(slug: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/slug/${slug}`);
  }

  create(payload: CreateRestaurantPayload): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${this.baseUrl}/restaurants`, payload);
  }

  update(id: string, payload: UpdateRestaurantPayload): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.baseUrl}/restaurants/${id}`, payload);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/restaurants/${id}`);
  }

  // baseUrl resolved via api-config
}
