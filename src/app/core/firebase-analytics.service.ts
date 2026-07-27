import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { environment } from '../../environments/environment';

/**
 * Firebase Analytics wrapper. Browser-only — `isSupported()` also rules out
 * SSR and browsers without IndexedDB (Firebase Analytics' requirement), so
 * `analytics` stays undefined during server rendering.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseAnalyticsService {
  private app?: FirebaseApp;
  private analytics?: Analytics;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  async init(): Promise<void> {
    if (this.app || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!(await isSupported())) {
      return;
    }
    this.app = initializeApp(environment.firebaseConfig);
    this.analytics = getAnalytics(this.app);
  }

  /** Send a custom Firebase Analytics event, e.g. logAnalyticsEvent('consult_started'). */
  logAnalyticsEvent(name: string, params?: Record<string, unknown>): void {
    if (this.analytics) {
      logEvent(this.analytics, name, params);
    }
  }
}
