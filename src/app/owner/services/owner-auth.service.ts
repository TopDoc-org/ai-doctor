import { Injectable } from '@angular/core';

// Creator session — localStorage under owner-scoped keys so it never clashes
// with patient, partner, or admin auth.
const LS_TOKEN = 'ownerToken';
const LS_NAME = 'ownerName';

@Injectable({ providedIn: 'root' })
export class OwnerAuthService {
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
