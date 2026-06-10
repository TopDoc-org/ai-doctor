import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CountryService } from '../ai-doctor/services/country.service';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, OnDestroy {
  appName = environment.appName;
  query = '';
  placeholder = '';
  countryName: string | null = null;
  emergencyNumbers = environment.emergencyNumbers;

  // Rotating hero slides (text-only carousel) — headline + supporting line.
  heroSlides = [
    {
      title: 'Ask anything, free',
      text: 'Describe your symptoms or ask any health question — no sign-up, no credit card, no friction.',
    },
    {
      title: 'Find the right specialist',
      text: "Not sure who to see? We read your concern and point you to the right speciality — so you don't guess.",
    },
    {
      title: 'A clear, shareable summary',
      text: 'Get an easy-to-read summary of your concern that you can carry to any doctor.',
    },
    {
      title: 'Understand the jargon',
      text: 'Confused by a lab report or a medicine? Ask in plain language and get a clear, calm answer.',
    },
    {
      title: 'Doctors near you',
      text: 'Find trusted doctors close by in seconds, matched to what you actually need.',
    },
  ];

  // Example queries typed into the input placeholder, one after another.
  useCases = [
    'Is it safe to take antacids on an empty stomach?',
    'Sore throat and mild fever for 3 days…',
    'Which specialist should I see for chest pain?',
    'My child has a rash — what could it be?',
    'Persistent headache for a week — should I worry?',
  ];

  private phIndex = 0;
  private phTimer: any = null;

  // Claims must be substantiable (Consumer Protection / CCPA / ASCI). "Anonymous"
  // and "verified" were inaccurate once accounts/PII exist and doctors are an
  // unvetted maps directory.
  trustChips = [
    { icon: 'money_off', label: 'Free — no card, no sign-up' },
    { icon: 'medical_services', label: 'Suggests the right specialist' },
    { icon: 'lock', label: 'Privacy-first' },
    { icon: 'shield', label: 'Private & secure' },
    { icon: 'info', label: 'Information-only, not a prescription' },
    { icon: 'menu_book', label: 'Educational information' },
  ];

  // Static-friendly: this exact value lands in the prerendered HTML, so it must
  // read sensibly without JS (it swaps to "You are in X" after detection).
  readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private country: CountryService,
    private seo: SeoService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Label for the location banner. Avoids an escaped apostrophe in the template.
  get locationLabel(): string {
    return this.countryName ? `You are in ${this.countryName}` : 'Available worldwide';
  }

  // Country-aware copy with neutral fallbacks when the country is unknown.
  // e.g. "India's" / "Your", and "built for India" / "built for you".
  get countryPossessive(): string {
    return this.countryName ? `${this.countryName}'s` : 'Your';
  }
  get countryForCopy(): string {
    return this.countryName || 'you';
  }
  // " in India" when known, "" otherwise — used inline mid-sentence.
  get inCountry(): string {
    return this.countryName ? ` in ${this.countryName}` : '';
  }

  ngOnInit(): void {
    // FAQPage schema for the homepage only (mirrors the visible FAQ below).
    // Kept country-neutral so the prerendered markup is valid worldwide.
    this.seo.setJsonLd('faq', this.faqSchema());

    if (this.isBrowser) {
      // Typewriter is a self-rescheduling macrotask loop — it would keep the app
      // from ever becoming stable during prerender, so it is browser-only.
      this.typePlaceholder();
    } else {
      this.placeholder = this.useCases[0];
    }
    // Resolve country context (IP-based, cached) for the location banner.
    this.country.init().then(() => {
      this.countryName = this.country.countryName;
      this.emergencyNumbers = this.country.emergencyNumbers;
    });
  }

  ngOnDestroy(): void {
    if (this.phTimer) clearTimeout(this.phTimer);
    this.seo.removeJsonLd('faq');
  }

  private faqSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is DoctoGuide free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. DoctoGuide by KnocDoc is 100% free to start. There is no sign-up and no credit card needed to describe your symptoms and get AI health guidance.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is this an AI doctor or real medical advice?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DoctoGuide is an AI health-information assistant, not a licensed physician. It gives educational information and suggests which specialist to see, but it does not provide a diagnosis, treatment, or prescription. In an emergency, call your local emergency number (for example 911, 112, or 999).',
          },
        },
        {
          '@type': 'Question',
          name: 'Which specialist should I see for my symptoms?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Describe what you are feeling in plain language and DoctoGuide reads your concern and points you to the right speciality, then helps you find trusted doctors near you.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to sign up to use the AI symptom checker?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. You can use the AI symptom checker instantly with no sign-up. You only create an account if you want to save your health summary or past consultations.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can DoctoGuide help me find a doctor near me?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. After reviewing your symptoms, DoctoGuide can help you find licensed doctors near you by city or location, with ratings, hours, and contact details.',
          },
        },
      ],
    };
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

  start() {
    const q = (this.query || '').trim();
    this.router.navigate(['/triage'], {
      queryParams: q ? { q } : {},
    });
  }

  // Log in / Sign up both open the PIN auth gate inside the triage shell.
  login() {
    this.router.navigate(['/triage'], { queryParams: { login: 1 } });
  }
}
