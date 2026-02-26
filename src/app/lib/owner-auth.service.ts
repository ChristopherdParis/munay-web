import { Injectable, signal } from '@angular/core';

const OWNER_AUTH_KEY = 'ownerAuthed';

@Injectable({ providedIn: 'root' })
export class OwnerAuthService {
  readonly isAuthed = signal(this.loadAuth());

  login(username: string, password: string): boolean {
    const valid = username === 'owner' && password === 'mvp2026';
    this.isAuthed.set(valid);
    if (typeof window !== 'undefined') {
      if (valid) {
        window.localStorage.setItem(OWNER_AUTH_KEY, 'true');
      } else {
        window.localStorage.removeItem(OWNER_AUTH_KEY);
      }
    }
    return valid;
  }

  logout(): void {
    this.isAuthed.set(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(OWNER_AUTH_KEY);
    }
  }

  private loadAuth(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(OWNER_AUTH_KEY) === 'true';
  }
}
