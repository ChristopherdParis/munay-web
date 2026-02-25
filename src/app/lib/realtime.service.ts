import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { getRealtimeUrl } from './api-config';

type EventHandler = (payload: unknown) => void;

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;
  private restaurantId: string | null = null;
  private handlers: Array<{ event: string; handler: EventHandler }> = [];

  connect(restaurantId: string): void {
    if (this.socket && this.restaurantId === restaurantId) {
      return;
    }
    this.disconnect();
    this.restaurantId = restaurantId;
    this.socket = io(getRealtimeUrl(), {
      transports: ['websocket'],
      query: { restaurantId },
    });
  }

  on<T>(event: string, handler: (payload: T) => void): void {
    if (!this.socket) {
      return;
    }
    const wrapped: EventHandler = handler as EventHandler;
    this.handlers.push({ event, handler: wrapped });
    this.socket.on(event, wrapped);
  }

  clearHandlers(): void {
    if (!this.socket) {
      this.handlers = [];
      return;
    }
    for (const entry of this.handlers) {
      this.socket.off(entry.event, entry.handler);
    }
    this.handlers = [];
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = null;
    this.restaurantId = null;
    this.handlers = [];
  }
}
