import { Injectable } from '@angular/core';

// Super-admin session. Kept in localStorage under admin-scoped keys so it never
// clashes with patient (PIN) auth or the clinic-admin (partner) auth.
const LS_TOKEN = 'adminToken';
const LS_NAME = 'adminName';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  get token(): string | null {
    return localStorage.getItem(LS_TOKEN);
  }

  get name(): string | null {
    return localStorage.getItem(LS_NAME);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  setSession(token: string, name: string): void {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_NAME, name || '');
  }

  logout(): void {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_NAME);
  }
}
