import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageResponse, DoctorsResponse, Report } from '../models';
import { AiDoctorStateService } from './ai-doctor-state.service';
import { AffiliateService } from './affiliate.service';

export interface SessionState {
  sessionId: string;
  messages: { role: string; text: string; intent?: string }[];
  report: Report | null;
  emergency: boolean;
  age: number | null;
  sex: string | null;
  hasLead: boolean;
  triageState?: any;
  suggestedSpecialty?: string | null;
}

// --- PIN auth (TopDoc /user) ---
export interface NumCheckResponse {
  hits: number;
  results?: any[];
  message?: string;
}

export interface UserDetails {
  userId: string;
  name?: string;
  mobile?: string;
  gender?: string;
  userType?: string;
}

export interface LoginResponse {
  statuscode?: number;
  message?: string;
  token: string;
  userDetails: UserDetails;
}

// --- Consult history ---
export interface ConsultSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  hasReport: boolean;
  suggestedSpecialty: string | null;
  emergency: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiDoctorApiService {
  private base = `${environment.serverUrl}${environment.aiBase}`;
  private userBase = `${environment.serverUrl}${(environment as any).userBase}`;

  constructor(
    private http: HttpClient,
    private state: AiDoctorStateService,
    private affiliate: AffiliateService
  ) {}

  createSession(): Observable<{ sessionId: string; disclaimer: string }> {
    // Tag the new session to the user if logged in (so it lands in their history).
    const token = this.state.authToken;
    const options = token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
    // Tag the session to the referring clinic + digital campaign (utm) if present.
    const clinicId = this.affiliate.clinicId || undefined;
    const campaign = this.affiliate.campaign || undefined;
    const utm = this.affiliate.utm || undefined;
    return this.http.post<{ sessionId: string; disclaimer: string }>(
      `${this.base}/session`,
      { clinicId, campaign, utm },
      options
    );
  }

  // Rehydrate chat history from the server (authoritative).
  getSession(sessionId: string): Observable<SessionState> {
    return this.http.get<SessionState>(`${this.base}/session/${sessionId}`);
  }

  sendMessage(
    sessionId: string,
    text: string,
    opts?: { amend?: boolean }
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/message`, {
      sessionId,
      text,
      // Post-report amend: tells the backend to re-open the interview and
      // regenerate the report with the added/corrected details.
      amend: opts?.amend || undefined,
    });
  }

  generateReport(sessionId: string): Observable<{ type: string; report: Report }> {
    return this.http.post<{ type: string; report: Report }>(`${this.base}/report`, {
      sessionId,
    });
  }

  captureLead(
    sessionId: string,
    name: string,
    mobile: string,
    userId?: string | null,
    location?: {
      district?: string;
      city?: string;
      state?: string;
      lat?: number | null;
      lng?: number | null;
    }
  ): Observable<{ ok: boolean; lead?: any; message?: string }> {
    return this.http.post<{ ok: boolean; lead?: any; message?: string }>(
      `${this.base}/lead`,
      {
        sessionId,
        name,
        mobile,
        userId: userId || undefined,
        clinicId: this.affiliate.clinicId || undefined,
        campaign: this.affiliate.campaign || undefined,
        district: location?.district,
        city: location?.city,
        state: location?.state,
        lat: location?.lat ?? undefined,
        lng: location?.lng ?? undefined,
      }
    );
  }

  // --- PIN auth (TopDoc /user) ---
  numCheck(mobile: string): Observable<NumCheckResponse> {
    return this.http.post<NumCheckResponse>(`${this.userBase}/numCheck`, { mobile });
  }

  signup(payload: any): Observable<any> {
    return this.http.post<any>(`${this.userBase}/signup`, payload);
  }

  login(mobileNumber: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.userBase}/login`, {
      mobileNumber,
      password,
    });
  }

  setPin(payload: any): Observable<any> {
    return this.http.post<any>(`${this.userBase}/setPin`, payload);
  }

  // --- WhatsApp-OTP PIN reset (forgot / change PIN) ---
  sendWhatsappOtp(phoneNumber: string): Observable<any> {
    return this.http.post<any>(`${this.userBase}/sendWhatsappOtp`, { phoneNumber });
  }

  verifyWhatsappOtp(req: {
    phoneNumber: string;
    otp: string;
    otpId?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.userBase}/verifyWhatsappOtp`, req);
  }

  resetPinAfterOtp(mobileNumber: string, newPin: string): Observable<any> {
    return this.http.post<any>(`${this.userBase}/resetPinAfterOtp`, {
      mobileNumber,
      newPin,
    });
  }

  // --- Patient profile (KnocDoc /doctors endpoints; same as PatientFront app) ---
  // Fetch the logged-in user's detail fields.
  getUserDetails(userId: string, fields: string[]): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.state.authToken || ''}`,
    });
    return this.http.post<any>(
      `${environment.serverUrl}/doctors/doctorDetail`,
      { id: [userId], role: 'user', fields },
      { headers }
    );
  }

  // Save edited profile. Payload mirrors PatientFront's profileForm.value
  // (id, role:'user', first_name, last_name, DOB, email, medical_records, ...).
  updateUserDetails(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.state.authToken || ''}`,
    });
    return this.http.put<any>(
      `${environment.serverUrl}/doctors/updateDetails`,
      payload,
      { headers }
    );
  }

  // --- Consult history (Bearer token) ---
  listSessions(): Observable<{ sessions: ConsultSummary[] }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.state.authToken || ''}`,
    });
    return this.http.get<{ sessions: ConsultSummary[] }>(`${this.base}/sessions`, {
      headers,
    });
  }

  findDoctors(payload: {
    sessionId?: string;
    specialty?: string;
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    clinicId?: string | null;
  }): Observable<DoctorsResponse> {
    // Default the clinicId from the stored campaign ref so the backend can run
    // affiliate-first matching even if the caller didn't pass it explicitly.
    const body = {
      ...payload,
      clinicId: payload.clinicId ?? this.affiliate.clinicId ?? undefined,
    };
    return this.http.post<DoctorsResponse>(`${this.base}/doctors`, body);
  }

  // Returns the report PDF as a Blob (gated server-side by lead capture +
  // Bearer token — must send the auth header or the endpoint 401s).
  downloadReportPdf(sessionId: string): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.state.authToken || ''}`,
    });
    return this.http.get(`${this.base}/report/${sessionId}/pdf`, {
      headers,
      responseType: 'blob',
    });
  }
}
