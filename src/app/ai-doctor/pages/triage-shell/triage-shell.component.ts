import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AiDoctorApiService } from '../../services/ai-doctor-api.service';
import { AiDoctorStateService } from '../../services/ai-doctor-state.service';
import { GeolocationService } from '../../services/geolocation.service';
import { CountryService } from '../../services/country.service';
import {
  ChatMessage,
  Doctor,
  MessageResponse,
  PartnerOffer,
  Report,
  SpecialtySuggestion,
} from '../../models';
import { ReportPdfService } from '../../services/report-pdf.service';

@Component({
  selector: 'app-triage-shell',
  templateUrl: './triage-shell.component.html',
  styleUrls: ['./triage-shell.component.scss'],
})
export class TriageShellComponent implements OnInit, OnDestroy {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
  @ViewChild('composer') composer?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('reportTop') reportTop?: ElementRef<HTMLDivElement>;

  // Greeting doubles as the multilingual hint: the AI mirrors the user's
  // language (backend behaviour), so show it rather than just claim it.
  private readonly WELCOME =
    "Hi! I'm your AI health guide. Tell me what's bothering you — in any language you like: English, हिन्दी, Hinglish…";

  // Composer placeholder cycles through languages to demonstrate that the
  // user can reply in whichever one they're comfortable with.
  private readonly PLACEHOLDERS = [
    'Reply…  (Shift+Enter for a new line)',
    'Kisi bhi bhasha me likh sakte hain…',
    'आप किसी भी भाषा में लिख सकते हैं…',
  ];
  composerPlaceholder = this.PLACEHOLDERS[0];
  private placeholderTimer?: ReturnType<typeof setInterval>;

  // Country-aware emergency numbers + name (resolved by CountryService on init;
  // start with the environment fallback so the UI renders immediately).
  emergencyNumbers = environment.emergencyNumbers;
  countryName: string | null = null;
  appName = environment.appName;

  input = '';
  loading = false;
  emergency = false;

  // triage progress toward the report
  progress = 0;
  stepsLeft = 0;
  // Set once the backend signals no questions remain (stepsLeft === 0): the next
  // round-trip is the report itself, so we can show the "creating report" state.
  reportPending = false;

  report: Report | null = null;
  reportOpen = { causes: true, soap: true, confidence: false };

  // Inline report-feedback form (1-5 stars + optional note). Anonymous, tied to
  // the session; submitted state lives in AiDoctorStateService.feedbackSubmitted.
  feedbackRating = 0;
  feedbackText = '';

  // Post-report amend: user opted to add/correct details in the same chat; the
  // composer re-opens and the backend regenerates the report when done.
  amending = false;

  // consent gate (before first AI reply)
  showConsent = false;
  consentChecked = false;
  private pendingText = '';

  // age/sex quick-input
  sex: 'female' | 'male' | '' = '';
  age: number | null = null;
  ageSexDone = false; // hide the panel only AFTER submit (not while typing)
  // Adults-only gate: when the structured age input is under 18 we block the
  // send and surface this message. (Free-text under-18 disclosure is a backend
  // concern — documented as accepted risk in COMPLIANCE_AUDIT.md.)
  ageError = '';

  // Consult subject: a logged-in user may consult for themselves (reuse their
  // saved profile age/gender) or for someone else (ask fresh, don't touch
  // their profile). null = not yet chosen.
  consultFor: 'self' | 'other' | null = null;
  editingDetails = false; // show the raw age/gender inputs
  profileAge: number | null = null; // derived from saved DOB
  profileGender = ''; // 'male' | 'female' | 'other' | ''

  // doctor discovery
  doctors: Doctor[] = [];
  // affiliate-first: partner-clinic doctors shown above the generic results,
  // plus an optional clinic-wide offer banner.
  affiliateDoctors: Doctor[] = [];
  affiliateOffer: PartnerOffer | null = null;
  doctorsLoading = false;
  askCity = false;
  city = '';
  locError = '';

  // auth gate + consult history
  showAuth = false;
  showHistory = false;
  pendingAction: 'pdf' | 'soap' | 'doctors' | 'home' | null = null;

  // "leaving the chat" confirmation (anonymous users with an active chat)
  showLeaveDialog = false;

  // side drawer (account menu)
  showDrawer = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: AiDoctorApiService,
    public state: AiDoctorStateService,
    private geo: GeolocationService,
    private country: CountryService,
    private pdf: ReportPdfService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  get messages(): ChatMessage[] {
    return this.state.messages;
  }

  // Report is the funnel's end artifact: lock free-text chat once it's ready
  // (user can still find a doctor / start a new chat) — unless the user opted
  // to amend, which re-opens the composer until the updated report lands.
  get consultComplete(): boolean {
    return !!this.report && !this.emergency && !this.amending;
  }

  // Quick age/sex input is a shortcut for the FIRST triage question only.
  // Show it during that single turn — i.e. exactly one assistant message so far
  // (the age/sex ask) and the user hasn't replied yet. Counting turns (instead
  // of relying on pickAgeSex() to set a flag) keeps the panel from re-rendering
  // on every later question when the user answers age/sex as free text.
  get needAgeSex(): boolean {
    if (this.report || this.emergency || this.ageSexDone) return false;
    const assistantCount = this.messages.filter((m) => m.role === 'assistant').length;
    const last = this.messages[this.messages.length - 1];
    return assistantCount === 1 && last?.role === 'assistant';
  }

  // Ask "self or someone else?" for any logged-in user so a someone-else
  // consult never overwrites the account holder's profile.
  get askConsultFor(): boolean {
    return this.state.isLoggedIn;
  }

  // Do we have saved details to prefill/confirm for a self-consult?
  get hasProfileDetails(): boolean {
    return this.profileAge != null || !!this.profileGender;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.placeholderTimer = setInterval(() => {
        const i = this.PLACEHOLDERS.indexOf(this.composerPlaceholder);
        this.composerPlaceholder =
          this.PLACEHOLDERS[(i + 1) % this.PLACEHOLDERS.length];
      }, 4000);
    }

    // Resolve country context (IP-based, cached) -> swap in local emergency
    // numbers + country name. Server may still override per-message later.
    this.country.init().then(() => {
      this.emergencyNumbers = this.country.emergencyNumbers;
      this.countryName = this.country.countryName;
    });

    const seed = this.route.snapshot.queryParamMap.get('q');
    const wantsLogin = this.route.snapshot.queryParamMap.get('login') === '1';
    if (this.state.isLoggedIn) this.loadProfileDetails();
    // Don't create a session up front — that would persist an empty conversation
    // on every load. A session is created lazily on the first user message.
    if (wantsLogin) {
      this.consumeSeedParam();
      this.openAccount();
    }
    this.rehydrate(() => {
      if (this.state.messages.length === 0) {
        if (seed) {
          this.consumeSeedParam();
          this.send(seed);
        } else {
          this.state.addMessage({ role: 'assistant', text: this.WELCOME });
        }
      } else if (seed) {
        // history already exists -> don't replay seed; just clean the URL
        this.consumeSeedParam();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.placeholderTimer) clearInterval(this.placeholderTimer);
  }

  private consumeSeedParam(): void {
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private ensureSession(done: () => void): void {
    if (this.state.sessionId) {
      done();
      return;
    }
    this.api.createSession().subscribe({
      next: (res) => {
        this.state.sessionId = res.sessionId;
        done();
      },
      error: () => done(),
    });
  }

  // Pull authoritative history from the server so reloads don't lose the chat.
  private rehydrate(done: () => void): void {
    const sid = this.state.sessionId;
    if (!sid) return done();
    this.api.getSession(sid).subscribe({
      next: (s) => {
        this.state.setMessages(
          (s.messages || []).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            text: m.text,
            intent: m.intent,
          }))
        );
        if (s.report) {
          this.report = s.report;
          this.state.report = s.report;
        }
        // Resume an interrupted amend round (composer stays open).
        this.amending = s.triageState?.phase === 'amending';
        this.emergency = !!s.emergency;
        if (s.suggestedSpecialty) this.state.suggestedSpecialty = s.suggestedSpecialty;
        if (s.suggestedSpecialties?.length) {
          this.state.suggestedSpecialties = s.suggestedSpecialties;
        }
        if (s.hasLead) this.state.leadCaptured = true;
        if (s.age != null) {
          this.age = s.age;
          this.ageSexDone = true;
        }
        if (s.sex === 'male' || s.sex === 'female') this.sex = s.sex;
        if (this.report) this.scrollReportToTop();
        else this.scrollSoon();
        done();
      },
      error: () => done(), // stale/missing session -> start fresh
    });
  }

  submitInput(): void {
    const text = this.input.trim();
    if (!text || this.loading || this.emergency) return;
    this.input = '';
    this.resetComposerHeight();
    this.send(text);
  }

  // Grow the textarea with content, up to the CSS max-height.
  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  // Enter sends; Shift+Enter inserts a newline.
  onEnter(e: Event): void {
    const ke = e as KeyboardEvent;
    if (ke.shiftKey) return;
    e.preventDefault();
    this.submitInput();
  }

  private resetComposerHeight(): void {
    const el = this.composer?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  // Adults-only check for the structured age input. Returns false (and sets
  // ageError) when a valid age under 18 was entered; true otherwise.
  private validateAge(): boolean {
    if (this.age != null && this.age < 18) {
      this.ageError =
        "DoctoGuide is for adults (18+). For a child's or teen's health concern, a parent or guardian should consult a doctor directly.";
      return false;
    }
    this.ageError = '';
    return true;
  }

  pickAgeSex(): void {
    if (!this.sex && this.age == null) return;
    if (!this.validateAge()) return;
    const parts: string[] = [];
    if (this.age != null) parts.push(`I am ${this.age} years old`);
    if (this.sex) parts.push(`biological sex ${this.sex}`);
    this.ageSexDone = true;
    this.send(parts.join(', '));
  }

  // --- Consult subject (self vs other) ---
  // Self: prefill from the saved profile and let the user confirm. With nothing
  // saved yet, drop straight to the inputs (and persist on submit).
  chooseSelf(): void {
    this.ageError = '';
    this.consultFor = 'self';
    this.age = this.profileAge;
    this.sex =
      this.profileGender === 'male' || this.profileGender === 'female'
        ? this.profileGender
        : '';
    this.editingDetails = !this.hasProfileDetails;
  }

  // Someone else: ask fresh, never write back to the account holder's profile.
  chooseOther(): void {
    this.ageError = '';
    this.consultFor = 'other';
    this.editingDetails = true;
    this.age = null;
    this.sex = '';
  }

  // Saved details are wrong -> reveal the normal inputs (already prefilled).
  editSelf(): void {
    this.editingDetails = true;
  }

  // Saved details confirmed as-is -> send them straight through (no profile write).
  confirmSelf(): void {
    if (!this.validateAge()) return;
    this.pickAgeSex();
  }

  // Submit from the raw inputs. For a self-consult, persist any edits back to
  // the patient profile before sending the triage message.
  submitDetails(): void {
    if (!this.sex && this.age == null) return;
    // Validate before any profile write so an under-18 DOB is never persisted.
    if (!this.validateAge()) return;
    if (this.consultFor === 'self' && this.state.isLoggedIn) {
      this.saveProfileAgeSex();
    }
    this.pickAgeSex();
  }

  private loadProfileDetails(): void {
    const uid = this.state.userId;
    if (!uid) return;
    this.api.getUserDetails(uid, ['DOB', 'gender']).subscribe({
      next: (res) => {
        const d = res?.results?.[0] || {};
        this.profileAge = this.ageFromDob(d.DOB || d.dob);
        this.profileGender = (d.gender || '').toLowerCase();
      },
      error: () => {},
    });
  }

  // Persist edited self details. age -> approx DOB (Jan 1 of birth year; the
  // profile has no age field), sex -> gender. Fire-and-forget.
  private saveProfileAgeSex(): void {
    const uid = this.state.userId;
    if (!uid) return;
    const payload: any = { id: [uid], role: 'user' };
    if (this.sex) payload.gender = this.sex;
    if (this.age != null && this.age > 0) {
      payload.DOB = `${new Date().getFullYear() - this.age}-01-01`;
    }
    this.profileAge = this.age;
    if (this.sex) this.profileGender = this.sex;
    this.api.updateUserDetails(payload).subscribe({ next: () => {}, error: () => {} });
  }

  private ageFromDob(v: any): number | null {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a >= 0 && a < 150 ? a : null;
  }

  // Adds the user bubble, then gates on consent before hitting the backend.
  // Session is created lazily inside dispatch() on the first real message.
  private send(text: string): void {
    this.state.addMessage({ role: 'user', text });
    this.scrollSoon();
    if (!this.state.consented) {
      this.pendingText = text;
      this.showConsent = true;
      return;
    }
    this.dispatch(text);
  }

  agreeConsent(): void {
    if (!this.consentChecked) return;
    this.state.consented = true;
    this.showConsent = false;
    const t = this.pendingText;
    this.pendingText = '';
    if (t) this.dispatch(t);
  }

  private dispatch(text: string): void {
    // Create the session on demand (first message) so empty visits aren't stored.
    this.ensureSession(() => this.dispatchToSession(text));
  }

  // Re-open the chat after the report so the user can add or correct details;
  // the backend re-runs the interview on the new info and regenerates the report.
  startAmend(): void {
    if (!this.report || this.emergency) return;
    this.amending = true;
    this.state.addMessage({
      role: 'assistant',
      text: "Sure — tell me what you'd like to add or correct, and I'll update your report.",
    });
    this.scrollSoon();
    setTimeout(() => this.composer?.nativeElement?.focus(), 100);
  }

  private dispatchToSession(text: string): void {
    const sid = this.state.sessionId!;
    this.loading = true;
    this.api.sendMessage(sid, text, { amend: this.amending }).subscribe({
      next: (res) => {
        this.loading = false;
        this.handleResponse(res);
        // Report lands -> scroll to its top; any other reply -> follow to bottom.
        if (res.type === 'report' && res.report) this.scrollReportToTop();
        else this.scrollSoon();
      },
      error: () => {
        this.loading = false;
        this.state.addMessage({
          role: 'assistant',
          text: 'Sorry, something went wrong. Please try again.',
        });
      },
    });
  }

  private handleResponse(res: MessageResponse): void {
    const say = (t?: string) =>
      t && this.state.addMessage({ role: 'assistant', text: t, intent: res.intent });

    switch (res.type) {
      case 'emergency':
        this.emergency = true;
        say(res.message);
        break;
      case 'report':
        if (res.report) {
          this.report = res.report;
          this.state.report = res.report;
          this.state.suggestedSpecialty = res.report.suggestedSpecialty || null;
          this.state.suggestedSpecialties = res.report.suggestedSpecialties || [];
          // A new/updated report resets the user's pick back to the primary.
          this.state.selectedSpecialty = null;
        }
        if (this.amending) {
          this.amending = false;
          say("I've updated your report with the new details.");
        }
        this.progress = 100;
        this.stepsLeft = 0;
        this.reportPending = false;
        break;
      case 'question': {
        say(res.message || res.question);
        // During an amend round the report already exists — keep the progress
        // bar at 100 instead of replaying interview progress.
        if (!this.amending) {
          if (res.progress != null) this.progress = res.progress;
          if (res.stepsLeft != null) this.stepsLeft = res.stepsLeft;
          // No questions left -> the next answer triggers report generation.
          this.reportPending = this.stepsLeft <= 0;
        }
        break;
      }
      case 'find_doctor':
        say(res.message);
        this.state.suggestedSpecialty =
          res.suggestedSpecialty || this.state.suggestedSpecialty;
        this.connectDoctor();
        break;
      case 'refusal':
      case 'medicine_info':
      case 'general_health':
      case 'out_of_scope':
      default:
        say(res.message);
        break;
    }
  }

  // ---- Report actions (auth-gated) ----
  downloadPdf(): void {
    if (!this.state.isLoggedIn) return this.openAuth('pdf');
    this.runPdf();
  }

  downloadSoapPdf(): void {
    if (!this.state.isLoggedIn) return this.openAuth('soap');
    this.runSoapPdf();
  }

  connectDoctor(): void {
    if (!this.state.isLoggedIn) return this.openAuth('doctors');
    this.openLocationPrompt();
  }

  shareReport(): void {
    const nav: any = navigator;
    if (nav.share) {
      nav
        .share({
          title: 'My Health Summary',
          text: this.report?.summary || `Health summary from ${this.appName}`,
        })
        .catch(() => {});
    } else {
      alert('Sharing is not supported on this device.');
    }
  }

  private openAuth(action: 'pdf' | 'soap' | 'doctors' | 'home' | null): void {
    this.pendingAction = action;
    this.showAuth = true;
  }

  // ---- Leaving the chat (logo -> home) ----
  // An anonymous user with a live conversation gets a heads-up first: log in to
  // save it, or continue and recover it later from the "previous chat" banner.
  // Logged-in users' chats are already in "My consults", so they go straight home.
  goHome(): void {
    const hasConversation =
      !!this.state.sessionId && this.messages.some((m) => m.role === 'user');
    if (!this.state.isLoggedIn && hasConversation) {
      this.showLeaveDialog = true;
      return;
    }
    this.state.stashSession();
    this.router.navigate(['/']);
  }

  leaveAndLogin(): void {
    this.showLeaveDialog = false;
    this.openAuth('home');
  }

  leaveWithoutSaving(): void {
    this.showLeaveDialog = false;
    this.state.stashSession();
    this.router.navigate(['/']);
  }

  // ---- Previous (unsaved) chat banner ----
  get hasPrevChat(): boolean {
    return !!this.state.prevSessionId;
  }

  loadPreviousChat(): void {
    const prev = this.state.prevSessionId;
    if (!prev) return;
    this.state.prevSessionId = null;
    this.openPastSession(prev);
  }

  dismissPreviousChat(): void {
    this.state.prevSessionId = null;
  }

  // Header "My consults / Log in": logged-in -> history, else open auth (no action).
  openAccount(): void {
    if (this.state.isLoggedIn) this.showHistory = true;
    else this.openAuth(null);
  }

  // --- Side drawer (account menu) ---
  openDrawer(): void {
    this.showDrawer = true;
  }

  closeDrawer(): void {
    this.showDrawer = false;
  }

  openProfile(): void {
    this.showDrawer = false;
    this.router.navigate(['/triage/profile']);
  }

  openChangePin(): void {
    this.showDrawer = false;
    this.router.navigate(['/triage/change-pin']);
  }

  // Auth succeeded: link the AI session to the account (keeps server PDF gate
  // working + tags the session for history), then run the pending action.
  onAuthSuccess(ev: {
    name: string;
    mobile: string;
    userId: string;
    district?: string;
    city?: string;
    state?: string;
    lat?: number | null;
    lng?: number | null;
  }): void {
    this.showAuth = false;
    // Remember the district/location so the doctor search can reuse it.
    if (ev.lat != null && ev.lng != null) {
      this.state.location = {
        lat: ev.lat,
        lng: ev.lng,
        city: ev.city || null,
        district: ev.district || null,
        state: ev.state || null,
      };
    }
    if (ev.city || ev.district) this.city = ev.city || ev.district || '';
    const sid = this.state.sessionId;
    if (sid) {
      this.state.leadCaptured = true;
      this.api
        .captureLead(sid, ev.name, ev.mobile, ev.userId, {
          district: ev.district,
          city: ev.city,
          state: ev.state,
          lat: ev.lat,
          lng: ev.lng,
        })
        .subscribe({
          next: () => {},
          error: () => {},
        });
    }
    const action = this.pendingAction;
    this.pendingAction = null;
    if (action === 'pdf') this.runPdf();
    if (action === 'soap') this.runSoapPdf();
    if (action === 'doctors') this.openLocationPrompt();
    // Chat is now linked to the account (captureLead above) — safe to go home.
    if (action === 'home') this.router.navigate(['/']);
  }

  // --- Report feedback ---
  setFeedbackRating(n: number): void {
    this.feedbackRating = n;
  }

  // Fire-and-forget, like captureLead — never block the UI on the result.
  submitFeedback(): void {
    const sid = this.state.sessionId;
    if (!sid || this.feedbackRating < 1) return;
    this.api
      .submitFeedback(sid, this.feedbackRating, this.feedbackText, this.state.userId)
      .subscribe({ next: () => {}, error: () => {} });
    this.state.feedbackSubmitted = true;
  }

  // Log out -> clear auth + chat and return to landing.
  onLoggedOut(): void {
    this.showHistory = false;
    this.showDrawer = false;
    this.state.logout();
    this.state.reset();
    this.router.navigate(['/']);
  }

  // Open a past consultation and resume it (backend keeps triageState by sessionId).
  openPastSession(sessionId: string): void {
    this.showHistory = false;
    if (!sessionId || sessionId === this.state.sessionId) return;
    this.state.sessionId = sessionId;
    this.state.setMessages([]);
    this.report = null;
    this.state.report = null;
    this.amending = false;
    this.doctors = [];
    this.affiliateDoctors = [];
    this.affiliateOffer = null;
    this.askCity = false;
    this.emergency = false;
    this.ageSexDone = false;
    this.age = null;
    this.sex = '';
    this.ageError = '';
    this.consultFor = null;
    this.editingDetails = false;
    this.reportPending = false;
    this.rehydrate(() => this.scrollSoon());
  }

  // PDFs are built on the client from the report object, so the download works
  // without depending on a server PDF endpoint.
  private runPdf(): void {
    if (!this.report) return;
    const sid = this.state.sessionId || 'summary';
    try {
      this.pdf.downloadReport(this.report, this.appName, `health-report-${sid}.pdf`);
    } catch {
      alert('Could not generate the report. Please try again.');
    }
  }

  private runSoapPdf(): void {
    if (!this.report) return;
    const sid = this.state.sessionId || 'summary';
    try {
      this.pdf.downloadSoap(this.report, this.appName, `soap-note-${sid}.pdf`);
    } catch {
      alert('Could not generate the SOAP note. Please try again.');
    }
  }

  // ---- Doctor location flow (honors typed locality; geo is optional) ----
  private openLocationPrompt(): void {
    this.locError = '';
    // Prefill from the district/city captured at sign-in if we have it.
    if (!this.city) {
      this.city =
        this.state.location?.district || this.state.location?.city || '';
    }
    this.askCity = true;
  }

  async useMyLocation(): Promise<void> {
    this.locError = '';
    this.doctorsLoading = true;
    const loc = await this.geo.getCurrentPosition();
    this.state.location = loc;
    if (loc.lat == null || loc.lng == null) {
      this.doctorsLoading = false;
      this.locError = "Couldn't get your location — type your city/area instead.";
      return;
    }
    this.askCity = false;
    this.fetchDoctors({ lat: loc.lat, lng: loc.lng });
  }

  submitCity(): void {
    const c = this.city.trim();
    if (!c) return;
    this.askCity = false;
    this.doctorsLoading = true;
    this.fetchDoctors({ city: c });
  }

  private fetchDoctors(locPart: { lat?: number; lng?: number; city?: string }): void {
    const sid = this.state.sessionId || undefined;
    const specialty = this.selectedSpecialty || undefined;
    this.doctorsLoading = true;
    this.api.findDoctors({ sessionId: sid, specialty, ...locPart }).subscribe({
      next: (res) => {
        this.doctorsLoading = false;
        this.doctors = res.doctors || [];
        this.affiliateDoctors = res.affiliateDoctors || [];
        this.affiliateOffer = res.affiliateOffer || null;
        if (this.doctors.length === 0 && this.affiliateDoctors.length === 0) {
          this.state.addMessage({
            role: 'assistant',
            text: res.error || 'I could not find doctors there. Try another area.',
          });
        }
        this.scrollSoon();
      },
      error: () => {
        this.doctorsLoading = false;
        this.locError = 'Search failed. Please try again.';
      },
    });
  }

  // Top pick = highest rating, then most reviews. Returns the recommended doctor.
  get recommendedDoctor(): Doctor | null {
    if (!this.doctors || !this.doctors.length) return null;
    return [...this.doctors].sort(
      (a, b) =>
        (b.rating || 0) - (a.rating || 0) ||
        (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0)
    )[0];
  }

  // Why the recommended doctor is a good fit (template — no extra LLM cost).
  recommendReason(d: Doctor): string {
    const spec = this.selectedSpecialty || 'your concern';
    const bits = [`Matches the suggested specialist for you (${spec})`];
    if (d.rating) {
      bits.push(
        `highest rated nearby — ${d.rating}★${d.userRatingsTotal ? ' (' + d.userRatingsTotal + ' reviews)' : ''}`
      );
    }
    if (d.openNow === true) bits.push('open now');
    return bits.join(' · ');
  }

  // Initials for the avatar fallback (no free doctor photos available).
  initials(name?: string): string {
    if (!name) return '?';
    return name
      .replace(/^(dr\.?|the)\s+/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // Deterministic avatar colour from the name.
  avatarColor(name?: string): string {
    const colors = ['#0D9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2'];
    let h = 0;
    for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  }

  // Unified specialist list: ranked array from the report, or a single entry
  // synthesized from the legacy string — one code path for old and new reports.
  get specialists(): SpecialtySuggestion[] {
    const list =
      this.report?.suggestedSpecialties || this.state.suggestedSpecialties;
    if (list?.length) return list;
    const single = this.report?.suggestedSpecialty || this.state.suggestedSpecialty;
    return single ? [{ specialty: single, primary: true }] : [];
  }

  get multiSpecialist(): boolean {
    return this.specialists.length > 1;
  }

  // The specialty every CTA / doctor search uses: the user's pick, else primary.
  get selectedSpecialty(): string | null {
    const sel = this.state.selectedSpecialty;
    if (sel && this.specialists.some((s) => s.specialty === sel)) return sel;
    return this.specialists[0]?.specialty || null;
  }

  // The non-selected alternatives — surfaced as "Also recommended" links.
  get otherSpecialists(): SpecialtySuggestion[] {
    const sel = this.selectedSpecialty;
    return this.specialists.filter((s) => s.specialty !== sel);
  }

  selectSpecialist(specialty: string): void {
    if (specialty === this.selectedSpecialty) return;
    this.state.selectedSpecialty = specialty;
    // Results on screen belong to the previous specialty — refetch in place
    // with the location we already have, else clear so the next search is right.
    if (this.doctors.length || this.affiliateDoctors.length) {
      this.doctors = [];
      this.affiliateDoctors = [];
      this.affiliateOffer = null;
      const loc = this.state.location;
      if (loc?.lat != null && loc?.lng != null) {
        this.fetchDoctors({ lat: loc.lat, lng: loc.lng });
      } else if (this.city.trim()) {
        this.fetchDoctors({ city: this.city.trim() });
      }
    }
  }

  // The specialist recommended by the report, with the right article — used to
  // personalise the "connect with a doctor" surfaces ("an Orthopedist", "a
  // Neurologist"). Falls back to the generic wording when no report yet.
  get specialistLabel(): string {
    const s = this.selectedSpecialty;
    if (!s) return 'a licensed doctor';
    // "u" excluded: U-initial specialties (Urologist) start with a "yoo" sound.
    return `${/^[aeio]/i.test(s) ? 'an' : 'a'} ${s}`;
  }

  // Split a SOAP field into readable bullet lines.
  toBullets(text?: string): string[] {
    if (!text) return [];
    return text
      .split(/(?:\.\s+|\n|;\s*|•\s*)/)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter((s) => s.length > 1);
  }

  restart(): void {
    this.state.reset();
    this.emergency = false;
    this.report = null;
    this.amending = false;
    this.feedbackRating = 0;
    this.feedbackText = '';
    this.doctors = [];
    this.affiliateDoctors = [];
    this.affiliateOffer = null;
    this.askCity = false;
    this.ageSexDone = false;
    this.age = null;
    this.sex = '';
    this.ageError = '';
    this.consultFor = null;
    this.editingDetails = false;
    this.showConsent = false;
    this.consentChecked = false;
    this.showAuth = false;
    this.showHistory = false;
    this.showDrawer = false;
    this.progress = 0;
    this.stepsLeft = 0;
    this.reportPending = false;
    // Fresh start in place (no new session yet — created on the first message).
    this.state.addMessage({ role: 'assistant', text: this.WELCOME });
    this.scrollSoon();
  }

  private scrollSoon(): void {
    setTimeout(
      () => this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' }),
      60
    );
  }

  // When the report lands we want the user to read it from the top — not get
  // dumped at the bottom of the page like a normal chat reply.
  private scrollReportToTop(): void {
    setTimeout(
      () =>
        this.reportTop?.nativeElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      80
    );
  }

  // True only while the final report is actually being generated — i.e. the
  // backend has signalled no questions remain (stepsLeft === 0) and we're
  // waiting on that in-flight request. Using stepsLeft (not a loose progress
  // threshold) stops the overlay flashing while the AI is still asking things.
  get generatingReport(): boolean {
    return (
      this.loading &&
      !this.report &&
      !this.emergency &&
      this.reportPending
    );
  }
}
