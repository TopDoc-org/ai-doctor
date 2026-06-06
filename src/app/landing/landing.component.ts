import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CountryService } from '../ai-doctor/services/country.service';

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

  constructor(private router: Router, private country: CountryService) {}

  // Label for the location banner. Avoids an escaped apostrophe in the template.
  get locationLabel(): string {
    return this.countryName ? `You are in ${this.countryName}` : 'Detecting your location…';
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
    this.typePlaceholder();
    // Resolve country context (IP-based, cached) for the location banner.
    this.country.init().then(() => {
      this.countryName = this.country.countryName;
      this.emergencyNumbers = this.country.emergencyNumbers;
    });
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
