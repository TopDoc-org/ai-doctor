import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SeoData, SeoService } from './core/seo.service';
import { FirebaseAnalyticsService } from './core/firebase-analytics.service';
import { AffiliateService } from './ai-doctor/services/affiliate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'DoctoGuide';
  private sub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private seo: SeoService,
    private firebaseAnalytics: FirebaseAnalyticsService,
    private affiliate: AffiliateService,
  ) {}

  ngOnInit(): void {
    // Capture campaign attribution (?ref=clinicId) on the first load before
    // any internal navigation strips the query string.
    this.affiliate.capture();
    this.firebaseAnalytics.init();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // Re-check in case the app booted on a route that resolves the query
        // string after init (deep-linked /triage?ref=…).
        this.affiliate.capture();
        const data = this.collectSeo();
        const urlPath = this.router.url.split('?')[0].split('#')[0] || '/';
        this.seo.update(data, urlPath);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /**
   * Walk the activated route tree and merge each level's `data.seo`, so a
   * child route overrides its parent while inheriting anything it omits
   * (e.g. triage children inherit the parent's noindex directive).
   */
  private collectSeo(): SeoData | undefined {
    let route: ActivatedRoute | null = this.route;
    let merged: SeoData | undefined;
    while (route) {
      const seo = route.snapshot.data['seo'] as SeoData | undefined;
      if (seo) {
        merged = { ...merged, ...seo };
      }
      route = route.firstChild;
    }
    return merged;
  }
}
