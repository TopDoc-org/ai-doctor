import { Injectable } from '@angular/core';
import { ChatMessage, Report, GeoLocation, SpecialtySuggestion } from '../models';

const LS_SESSION = 'aiDoctorSessionId';
const LS_PREV_SESSION = 'aiDoctorPrevSessionId';
const LS_LEAD = 'aiDoctorLeadCaptured';
const LS_FEEDBACK = 'aiDoctorFeedbackDone';
const LS_CONSENT = 'aiDoctorConsent';
const LS_REPORT_TRACKED = 'aiDoctorReportTracked';
const LS_TOKEN = 'aiDoctorToken';
const LS_USERID = 'aiDoctorUserId';
const LS_USERNAME = 'aiDoctorUserName';
const LS_USERMOBILE = 'aiDoctorUserMobile';

// Lightweight session state. sessionId persists in localStorage so a refresh
// resumes the same anonymous session; chat history is rehydrated from the server.
@Injectable({ providedIn: 'root' })
export class AiDoctorStateService {
  messages: ChatMessage[] = [];
  report: Report | null = null;
  location: GeoLocation | null = null;
  suggestedSpecialty: string | null = null;
  // Full ranked list from the report (1-3 entries); empty for legacy reports.
  suggestedSpecialties: SpecialtySuggestion[] = [];
  // The specialist the user picked from the cards; null = primary/legacy single.
  selectedSpecialty: string | null = null;

  get sessionId(): string | null {
    return localStorage.getItem(LS_SESSION);
  }
  set sessionId(id: string | null) {
    if (id) localStorage.setItem(LS_SESSION, id);
    else localStorage.removeItem(LS_SESSION);
  }

  // Last session left behind without an account — offered back to the user
  // via the "load previous chat" banner until loaded or dismissed.
  get prevSessionId(): string | null {
    return localStorage.getItem(LS_PREV_SESSION);
  }
  set prevSessionId(id: string | null) {
    if (id) localStorage.setItem(LS_PREV_SESSION, id);
    else localStorage.removeItem(LS_PREV_SESSION);
  }

  // Park the current session as "previous" (recoverable from the banner),
  // then clear live state so the next visit starts a fresh chat.
  stashSession(): void {
    if (this.sessionId) this.prevSessionId = this.sessionId;
    this.reset();
  }

  get leadCaptured(): boolean {
    return localStorage.getItem(LS_LEAD) === '1';
  }
  set leadCaptured(v: boolean) {
    localStorage.setItem(LS_LEAD, v ? '1' : '0');
  }

  // Whether the user has rated the report this session — collapses the inline
  // feedback form into a "thank you" state and prevents re-submission.
  get feedbackSubmitted(): boolean {
    return localStorage.getItem(LS_FEEDBACK) === '1';
  }
  set feedbackSubmitted(v: boolean) {
    localStorage.setItem(LS_FEEDBACK, v ? '1' : '0');
  }

  // Whether the `report_generated` analytics event has already fired for this
  // consult. The report object is re-assigned on every rehydrate (page refresh,
  // opening a past consult) and again on each amend, so without this latch the
  // conversion would be counted several times for one consult. Cleared by
  // reset(), which is what "New chat" runs — so the next consult counts again.
  get reportTracked(): boolean {
    return localStorage.getItem(LS_REPORT_TRACKED) === '1';
  }
  set reportTracked(v: boolean) {
    localStorage.setItem(LS_REPORT_TRACKED, v ? '1' : '0');
  }

  get consented(): boolean {
    return localStorage.getItem(LS_CONSENT) === '1';
  }
  set consented(v: boolean) {
    localStorage.setItem(LS_CONSENT, v ? '1' : '0');
  }

  // --- Auth (PIN account). Persisted so a returning user stays logged in and
  // can reach their consult history. Survives reset() (New chat). ---
  get authToken(): string | null {
    return localStorage.getItem(LS_TOKEN);
  }
  set authToken(t: string | null) {
    if (t) localStorage.setItem(LS_TOKEN, t);
    else localStorage.removeItem(LS_TOKEN);
  }

  get userId(): string | null {
    return localStorage.getItem(LS_USERID);
  }
  set userId(id: string | null) {
    if (id) localStorage.setItem(LS_USERID, id);
    else localStorage.removeItem(LS_USERID);
  }

  get userName(): string | null {
    return localStorage.getItem(LS_USERNAME);
  }
  set userName(n: string | null) {
    if (n) localStorage.setItem(LS_USERNAME, n);
    else localStorage.removeItem(LS_USERNAME);
  }

  get userMobile(): string | null {
    return localStorage.getItem(LS_USERMOBILE);
  }
  set userMobile(m: string | null) {
    if (m) localStorage.setItem(LS_USERMOBILE, m);
    else localStorage.removeItem(LS_USERMOBILE);
  }

  get isLoggedIn(): boolean {
    return !!this.authToken;
  }

  logout(): void {
    this.authToken = null;
    this.userId = null;
    this.userName = null;
    this.userMobile = null;
  }

  addMessage(m: ChatMessage) {
    this.messages.push(m);
  }

  setMessages(msgs: ChatMessage[]) {
    this.messages = msgs;
  }

  reset() {
    this.messages = [];
    this.report = null;
    this.location = null;
    this.suggestedSpecialty = null;
    this.suggestedSpecialties = [];
    this.selectedSpecialty = null;
    this.sessionId = null;
    localStorage.removeItem(LS_LEAD);
    localStorage.removeItem(LS_FEEDBACK);
    localStorage.removeItem(LS_CONSENT); // re-ask consent on each new chat
    localStorage.removeItem(LS_REPORT_TRACKED); // count the next report again
  }
}
