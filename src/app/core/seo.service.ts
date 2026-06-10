import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { CountryService } from '../ai-doctor/services/country.service';

/** Canonical site origin (production frontend). Update if the domain changes. */
export const SITE_URL = 'https://www.knocdoc.in';

/**
 * Placeholder for the user's country in SEO strings (route `data.seo` + DEFAULTS).
 * Resolved at runtime to the detected country. When the country is unknown (during
 * prerender, or before IP detection resolves) the token is dropped gracefully, so
 * use it only in suffix positions like " in %COUNTRY%" / " for %COUNTRY%" — never
 * mid-sentence where its removal would leave a grammar hole.
 */
export const COUNTRY_TOKEN = '%COUNTRY%';

/** Per-route SEO metadata, attached via route `data: { seo: {...} }`. */
export interface SeoData {
  title?: string;
  description?: string;
  /** Robots directive, e.g. 'index,follow' or 'noindex,nofollow'. */
  robots?: string;
  /** Absolute OG image URL. Falls back to the default social card. */
  image?: string;
}

const DEFAULTS: Required<SeoData> = {
  title: `AI Doctor & Free Symptom Checker in ${COUNTRY_TOKEN} | DoctoGuide by KnocDoc`,
  description:
    `Free AI doctor & symptom checker. Describe your symptoms, get instant AI health guidance, learn which specialist to see, and find trusted doctors near you in ${COUNTRY_TOKEN}. No sign-up. DoctoGuide by KnocDoc.`,
  robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
  image: `${SITE_URL}/assets/og-image.png`,
};

/**
 * Updates the document title, meta tags, canonical link, and Open Graph /
 * Twitter tags on each route change. This is the client-side SEO layer for the
 * SPA — Googlebot renders JS and will pick these up, but note that non-JS social
 * crawlers (WhatsApp, Facebook) only read the static tags baked into index.html.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  // Last applied route SEO, so we can re-render once the country resolves async.
  private lastData: SeoData | undefined;
  private lastUrl: string | null = null;

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document,
    private country: CountryService,
  ) {
    // Country detection is async (IP-based). Re-apply the current route's tags
    // once it resolves so %COUNTRY% swaps to the detected place.
    this.country.init().then(() => {
      if (this.lastUrl !== null) this.update(this.lastData, this.lastUrl);
    });
  }

  /**
   * Swap the country placeholder for the detected country. When unknown (prerender,
   * or before IP detection resolves) collapse the token and its " in " / " for "
   * preposition so the sentence stays world-neutral and grammatical.
   */
  private withCountry(s: string | undefined): string | undefined {
    if (!s) return s;
    const name = this.country.countryName;
    if (name) return s.split(COUNTRY_TOKEN).join(name);
    return s
      .replace(/\s*(in|for)\s+%COUNTRY%/gi, '')
      .split(COUNTRY_TOKEN).join('')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Apply SEO metadata for the current route.
   * @param data    merged `seo` data from the activated route chain
   * @param urlPath router URL (without query string) for the canonical link
   */
  update(data: SeoData | undefined, urlPath: string): void {
    this.lastData = data;
    this.lastUrl = urlPath;
    const merged = { ...DEFAULTS, ...(data ?? {}) };
    const seo = {
      ...merged,
      title: this.withCountry(merged.title)!,
      description: this.withCountry(merged.description)!,
    };
    const canonical = `${SITE_URL}${urlPath === '/' ? '/' : urlPath.replace(/\/$/, '')}`;

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: seo.robots });

    // No hreflang tags by design: one URL set, one language, runtime country
    // personalization — there are no language/region URL alternates to declare.
    // Revisit only if country-specific URLs (e.g. /in/...) ever ship.
    this.setCanonical(canonical);

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: seo.image });

    // Twitter
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: seo.image });
  }

  /** Insert or update the <link rel="canonical"> element. */
  private setCanonical(href: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  /**
   * Insert or replace a JSON-LD <script> block, keyed by id so it can be
   * swapped per route. Use for future condition / landing pages.
   */
  setJsonLd(id: string, schema: object): void {
    const elementId = `ld-${id}`;
    let script = this.doc.getElementById(elementId) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = elementId;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }

  /** Remove a JSON-LD block added via setJsonLd (call from ngOnDestroy of the owning page). */
  removeJsonLd(id: string): void {
    this.doc.getElementById(`ld-${id}`)?.remove();
  }
}
