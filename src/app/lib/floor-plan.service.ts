import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FloorPlan } from './types';
import { getApiBaseUrl } from './api-config';

@Injectable({ providedIn: 'root' })
export class FloorPlanService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  get(): Observable<FloorPlan> {
    return this.http.get<FloorPlan>(`${this.baseUrl}/floor-plan`);
  }

  update(plan: FloorPlan): Observable<FloorPlan> {
    return this.http.put<FloorPlan>(`${this.baseUrl}/floor-plan`, plan);
  }
}
