import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { CountryService } from '../ai-doctor/services/country.service';

/** Canonical site origin (production frontend). Update if the domain changes. */
export const SITE_URL = 'https://www.knocdoc.in';

/**
 * Placeholder for the user's country in SEO strings (route `data.seo` + DEFAULTS).
 * Resolved at runtime to the detected country, or the launch market when unknown —
 * meta needs a real place name, so the SEO fallback differs from the neutral UI copy.
 */
export const COUNTRY_TOKEN = '%COUNTRY%';
const SEO_COUNTRY_FALLBACK = 'India';

/** Per-route SEO metadata, attached via route `data: { seo: {...} }`. */
export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  /** Robots directive, e.g. 'index,follow' or 'noindex,nofollow'. */
  robots?: string;
  /** Absolute OG image URL. Falls back to the default social card. */
  image?: string;
}

const DEFAULTS: Required<Pick<SeoData, 'title' | 'description' | 'robots' | 'image'>> = {
  title: `AI Doctor & Free Symptom Checker ${COUNTRY_TOKEN} | DoctoGuide by KnocDoc`,
  description:
    `Free AI doctor & symptom checker for ${COUNTRY_TOKEN}. Describe your symptoms, get instant AI health guidance, learn which specialist to see, and find trusted doctors near you. No sign-up. DoctoGuide by KnocDoc.`,
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

  /** Swap the country placeholder for the detected country (or launch-market fallback). */
  private withCountry(s: string | undefined): string | undefined {
    if (!s) return s;
    return s.split(COUNTRY_TOKEN).join(this.country.countryName || SEO_COUNTRY_FALLBACK);
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
      keywords: this.withCountry(merged.keywords),
    };
    const canonical = `${SITE_URL}${urlPath === '/' ? '/' : urlPath.replace(/\/$/, '')}`;

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: seo.robots });
    if (seo.keywords) {
      this.meta.updateTag({ name: 'keywords', content: seo.keywords });
    }

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
}
