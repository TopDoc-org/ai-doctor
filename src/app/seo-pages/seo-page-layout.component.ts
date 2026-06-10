import { Component, Input } from '@angular/core';
import { environment } from '../../environments/environment';

// Shared chrome for the public SEO/content pages: header, hero (H1 + lede),
// prose content slot, CTA into /triage, cross-links, and the legal footer.
// These pages are prerendered, so everything here must render without JS.
@Component({
  selector: 'app-seo-page-layout',
  template: `
    <div class="min-h-screen bg-cream">
      <header class="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <a routerLink="/" class="flex items-center gap-1 font-heading text-xl font-extrabold text-teal-900">
          <span class="truncate">{{ appName }}</span>
          <span class="material-icons shrink-0 text-teal-500" style="font-size:18px">auto_awesome</span>
        </a>
        <a
          routerLink="/triage"
          class="rounded-full bg-teal-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >Get started</a>
      </header>

      <main class="mx-auto max-w-3xl px-6 pb-20">
        <h1 class="font-display text-3xl leading-tight text-teal-900 sm:text-4xl">{{ heading }}</h1>
        <p class="mt-3 text-[15px] leading-relaxed text-teal-900/70">{{ lede }}</p>

        <div class="seo-prose mt-8 text-[15px] leading-relaxed text-teal-900/80">
          <ng-content></ng-content>
        </div>

        <!-- CTA -->
        <div class="mt-12 rounded-2xl border border-teal-200 bg-teal-50/80 p-6 text-center">
          <p class="font-heading text-lg font-bold text-teal-900">{{ ctaTitle }}</p>
          <p class="mt-1 text-sm text-teal-900/70">Free. No sign-up, no credit card. Ready in seconds.</p>
          <a
            routerLink="/triage"
            class="mt-4 inline-flex items-center gap-1 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {{ ctaLabel }}
            <span class="material-icons" style="font-size:18px">arrow_forward</span>
          </a>
        </div>

        <!-- cross-links -->
        <nav class="mt-12 border-t border-black/5 pt-6">
          <p class="text-xs font-semibold uppercase tracking-wide text-teal-900/50">Explore DoctoGuide</p>
          <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <li *ngFor="let l of links">
              <a [routerLink]="l.path" class="text-teal-700 underline hover:text-teal-900">{{ l.label }}</a>
            </li>
          </ul>
        </nav>

        <p class="mt-10 text-xs text-teal-900/50">
          {{ appName }} is an AI health-information assistant, not a licensed physician. It does not
          provide medical advice, diagnosis, treatment, or prescriptions. In an emergency, call your
          local emergency number.
        </p>

        <footer class="mt-6 border-t border-black/5 pt-4 text-center text-xs text-teal-900/50">
          <a routerLink="/privacy" class="hover:text-teal-700">Privacy Policy</a>
          <span class="mx-2">·</span>
          <a routerLink="/terms" class="hover:text-teal-700">Terms of Use</a>
          <span class="mx-2">·</span>
          <a routerLink="/disclaimer" class="hover:text-teal-700">Medical Disclaimer</a>
        </footer>
      </main>
    </div>
  `,
  styles: [
    `
      .seo-prose h2 {
        font-family: var(--font-heading);
        font-weight: 700;
        font-size: 1.25rem;
        color: #134e4a;
        margin-top: 2rem;
        margin-bottom: 0.5rem;
      }
      .seo-prose h3 {
        font-family: var(--font-heading);
        font-weight: 600;
        font-size: 1.05rem;
        color: #134e4a;
        margin-top: 1.25rem;
        margin-bottom: 0.3rem;
      }
      .seo-prose p { margin-bottom: 0.8rem; }
      .seo-prose ul {
        list-style: disc;
        padding-left: 1.25rem;
        margin-bottom: 0.8rem;
      }
      .seo-prose ol {
        list-style: decimal;
        padding-left: 1.25rem;
        margin-bottom: 0.8rem;
      }
      .seo-prose li { margin-bottom: 0.35rem; }
      .seo-prose a { color: #0d9488; text-decoration: underline; }
      .seo-prose strong { color: #134e4a; }
      .seo-prose table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.8rem 0 1.2rem;
        font-size: 0.9rem;
      }
      .seo-prose th, .seo-prose td {
        border: 1px solid rgba(13, 148, 136, 0.25);
        padding: 0.5rem 0.75rem;
        text-align: left;
        vertical-align: top;
      }
      .seo-prose th {
        background: rgba(13, 148, 136, 0.08);
        font-weight: 600;
        color: #134e4a;
      }
      .seo-prose details {
        border: 1px solid rgba(13, 148, 136, 0.25);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.7);
        padding: 1rem;
        margin-bottom: 0.75rem;
      }
      .seo-prose summary {
        cursor: pointer;
        font-family: var(--font-heading);
        font-weight: 600;
        color: #134e4a;
      }
      .seo-prose details p { margin: 0.5rem 0 0; }
    `,
  ],
})
export class SeoPageLayoutComponent {
  appName = environment.appName;
  @Input() heading = '';
  @Input() lede = '';
  @Input() ctaTitle = 'Try DoctoGuide now';
  @Input() ctaLabel = 'Get started';

  // Cross-links between the public SEO pages (crawl path + UX).
  links = [
    { path: '/', label: 'Home' },
    { path: '/ai-doctor', label: 'AI Doctor' },
    { path: '/symptom-checker', label: 'Symptom Checker' },
    { path: '/which-specialist-to-see', label: 'Which Specialist to See' },
    { path: '/health-guide', label: 'Online Health Guide' },
    { path: '/emergency-numbers', label: 'Emergency Numbers by Country' },
  ];
}
