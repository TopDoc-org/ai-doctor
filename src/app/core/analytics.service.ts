import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 (gtag.js) wrapper.
 *
 * The script is injected at runtime (browser only — never during SSR) so the
 * measurement ID stays in the environment files and dev builds, where the ID
 * is empty, ship no analytics at all. Page views are sent manually on every
 * NavigationEnd because the SPA never reloads the page.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;
  private lastTrackedUrl = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  init(): void {
    const id = environment.gaMeasurementId;
    if (this.initialized || !id || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initialized = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // gtag relies on `arguments` (not rest params) being pushed verbatim.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    // SPA: suppress the automatic page_view; NavigationEnd below covers the
    // initial load and every route change exactly once.
    window.gtag('config', id, { send_page_view: false });

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    this.document.head.appendChild(script);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.trackPageView(e.urlAfterRedirects));

    // `initialNavigation: 'enabledBlocking'` finishes the first navigation
    // before this subscription exists, so report the booted route directly;
    // trackPageView dedupes if the NavigationEnd does still arrive.
    this.trackPageView(this.router.url);
  }

  private trackPageView(url: string): void {
    if (url === this.lastTrackedUrl) {
      return;
    }
    this.lastTrackedUrl = url;
    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: this.document.location.href,
      page_title: this.document.title,
    });
  }

  /** Send a custom GA4 event, e.g. trackEvent('consult_started'). */
  trackEvent(name: string, params?: Record<string, unknown>): void {
    if (this.initialized) {
      window.gtag('event', name, params);
    }
  }
}
