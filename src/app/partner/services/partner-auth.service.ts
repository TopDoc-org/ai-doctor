import { Injectable } from '@angular/core';

// Clinic-admin session. Kept in localStorage under partner-scoped keys so it
// never clashes with the patient (PIN) auth used by the AI Doctor app.
const LS_TOKEN = 'partnerToken';
const LS_CLINIC_ID = 'partnerClinicId';
const LS_CLINIC_NAME = 'partnerClinicName';

@Injectable({ providedIn: 'root' })
export class PartnerAuthService {
  get token(): string | null {
    return localStorage.getItem(LS_TOKEN);
  }

  get clinicId(): string | null {
    return localStorage.getItem(LS_CLINIC_ID);
  }

  get clinicName(): string | null {
    return localStorage.getItem(LS_CLINIC_NAME);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  setSession(token: string, clinicId: string, clinicName: string): void {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_CLINIC_ID, clinicId);
    localStorage.setItem(LS_CLINIC_NAME, clinicName || '');
  }

  logout(): void {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_CLINIC_ID);
    localStorage.removeItem(LS_CLINIC_NAME);
  }
}
