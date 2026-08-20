import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CountryService } from '../ai-doctor/services/country.service';
import { FirebaseAnalyticsService } from '../core/firebase-analytics.service';

/**
 * Paid-traffic landing page (`/start`). Deliberately NOT the SEO homepage.
 *
 * Google classifies a landing page into the "health" sensitive interest category
 * from personal-health signals: named conditions or symptoms, second-person
 * symptom framing ("describe how you feel"), medicines, procedures, mental or
 * sexual health, chronic-condition management. A page carrying those signals
 * keeps serving, but personalised-advertising targeting is restricted
 * (no Customer Match, no your-data segments, no lookalikes, no audience
 * expansion), which is what shows up in the UI as a limited campaign.
 *
 * This page therefore describes only the part of DoctoGuide that is a
 * *navigation* utility — working out which speciality fits and finding
 * practitioners nearby — and carries none of the personal-health vocabulary.
 * Nothing here is a claim the product does not make; the symptom-led surface
 * simply lives one click away, in /triage, behind the CTA.
 *
 * Hard rules for anyone editing this file (see ADS_COMPLIANCE_PLAN.md):
 *   - no condition, disease, or symptom names, in any language;
 *   - no "your symptoms" / "how you feel" / "what's wrong" framing;
 *   - no medicines, lab reports, prescriptions, treatments, procedures;
 *   - no mental-health, sexual-health, chronic-illness, or disability wording;
 *   - the hero entry box is allowed, but its label, rotating placeholders and
 *     aria-label must stay health-neutral; never copy LandingComponent.useCases
 *     into it;
 *   - keep the emergency line, but WITHOUT the enumerated warning signs.
 *
 * Route data sets robots noindex,nofollow: this page must never compete with
 * the SEO homepage for the same queries. It is excluded from sitemap.xml by
 * scripts/postbuild-seo.js and asserted absent by scripts/seo-check.js.
 */
@Component({
  selector: 'app-ad-landing',
  templateUrl: './ad-landing.component.html',
})
export class AdLandingComponent implements OnInit, OnDestroy {
  appName = environment.appName;

  /**
   * Hero entry box. Free text is passed to /triage as `q`, the same contract the
   * SEO homepage uses — but the visible copy is deliberately not the homepage's.
   */
  query = '';
  placeholder = '';

  /**
   * Rotating placeholder examples. These are NOT LandingComponent.useCases and
   * must never be replaced by them. Every line asks which *kind of doctor* the
   * visitor wants — the directory question — and none names a condition,
   * symptom, medicine, lab report or body part, in any language. Anything else
   * puts this paid landing page back into Google's health interest category
   * (ADS_COMPLIANCE_PLAN.md 3.3).
   */
  useCases = [
    'What kind of doctor are you looking for?',
    'Which type of doctor should I book with?',
    'Mujhe kis type ke doctor ko dhundhna chahiye?',
    'Show me the specialities available near me',
    'मुझे किस तरह के डॉक्टर की तलाश है?',
    'Find doctors close by, open today',
  ];

  private phIndex = 0;
  private phTimer: any = null;

  /**
   * Neutral, deduplicated emergency wording from CountryService. On this page it
   * effectively always renders the country-agnostic form ("your local emergency
   * services (112 / 911)") because the page is prerendered and paid visitors
   * arrive before IP detection resolves — which is exactly what we want here.
   */
  get emergencyNumbersText(): string {
    return this.country.emergencyNumbersText;
  }

  readonly isBrowser: boolean;

  // Three steps, kept in the file so the template stays a layout, not a script.
  steps = [
    {
      icon: 'forum',
      title: 'Tell us what you need',
      text: 'A short guided conversation, in your own words. English, हिन्दी, Hinglish — or any other language you prefer.',
    },
    {
      icon: 'alt_route',
      title: 'See which specialities could fit',
      text: 'Browse the doctor specialities that could be relevant, so you know your options before you book.',
    },
    {
      icon: 'place',
      title: 'See doctors near you',
      text: 'Practitioners close by, with hours and contact details, so you can book directly.',
    },
  ];

  reasons = [
    {
      icon: 'schedule',
      title: 'Save yourself a guess',
      text: 'Skip picking a speciality at random from a list — narrow it down first.',
    },
    {
      icon: 'description',
      title: 'Come in with a clear ask',
      text: "Leave with a short note of what you searched for, to reference if it's useful.",
    },
    {
      icon: 'payments',
      title: 'Free to use',
      text: 'No subscription, no credit card, no sign-up to get started.',
    },
  ];

  constructor(
    private router: Router,
    private country: CountryService,
    private analytics: FirebaseAnalyticsService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Resolve country context so the emergency line can name a local number
    // once detection lands, instead of staying generic forever.
    this.country.init();

    if (this.isBrowser) {
      // Self-rescheduling macrotask loop — it would keep the app from ever
      // becoming stable during prerender, so it is browser-only.
      this.typePlaceholder();
    } else {
      this.placeholder = this.useCases[0];
    }

    // No JSON-LD here on purpose. The page is noindex, and the schema types that
    // would fit (MedicalWebPage / FAQPage with health questions) are exactly the
    // machine-readable signal this page exists to avoid.
  }

  ngOnDestroy(): void {
    if (this.phTimer) clearTimeout(this.phTimer);
  }

  // Typewriter for the input placeholder: type a use-case, pause, erase, next.
  private typePlaceholder(): void {
    const full = this.useCases[this.phIndex] || '';
    if (this.placeholder.length < full.length) {
      this.placeholder = full.slice(0, this.placeholder.length + 1);
      this.phTimer = setTimeout(() => this.typePlaceholder(), 55);
      return;
    }
    this.phTimer = setTimeout(() => this.erasePlaceholder(), 1800);
  }

  private erasePlaceholder(): void {
    if (this.placeholder.length > 0) {
      this.placeholder = this.placeholder.slice(0, -1);
      this.phTimer = setTimeout(() => this.erasePlaceholder(), 30);
      return;
    }
    this.phIndex = (this.phIndex + 1) % this.useCases.length;
    this.phTimer = setTimeout(() => this.typePlaceholder(), 250);
  }

  /** Which CTA earned the click — hero, mid-page, or the closing block. */
  start(source: 'hero' | 'mid' | 'foot'): void {
    const q = (this.query || '').trim();
    this.analytics.logAnalyticsEvent('ad_lp_cta_click', { source, typed: q ? 1 : 0 });
    this.router.navigate(['/triage'], { queryParams: q ? { q } : {} });
  }
}
