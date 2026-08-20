import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmergencyNumbers {
  all: string;
  ambulance: string;
  police?: string;
  fire?: string;
}

interface CountryEntry {
  name: string | null;
  emergency: EmergencyNumbers;
}

type CountryMap = { default: CountryEntry } & Record<string, CountryEntry>;

interface CachedCountry {
  countryCode: string | null;
  countryName: string | null;
  emergencyNumbers: EmergencyNumbers;
  ts: number; // epoch ms when resolved
}

const LS_COUNTRY = 'aiDoctorCountry';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COUNTRIES_URL = 'assets/countries.json';

// Single source of truth for country context (emergency numbers + country name).
// Detection is IP-based (no permission prompt), resolved once and cached in
// localStorage so refreshes/return visits skip the network call entirely.
// Every failure path degrades to the environment fallback — never blocks the UI.
@Injectable({ providedIn: 'root' })
export class CountryService {
  countryCode: string | null = null;
  countryName: string | null = null;
  emergencyNumbers: EmergencyNumbers = environment.emergencyNumbers;

  private map: CountryMap | null = null;
  private ready: Promise<void> | null = null;

  private readonly isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Idempotent: safe to call from multiple components; resolves once.
  // During prerender this resolves immediately with a null (neutral) country —
  // detecting via IP on the server would bake the BUILD MACHINE's country into
  // the prerendered HTML of every page.
  init(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (!this.ready) this.ready = this.resolve();
    return this.ready;
  }

  private async resolve(): Promise<void> {
    // 1. Fresh cache -> no network at all.
    const cached = this.readCache();
    if (cached) {
      this.apply(cached);
      console.log('[CountryService] source=cache (no network)', {
        countryCode: cached.countryCode,
        countryName: cached.countryName,
        emergencyNumbers: cached.emergencyNumbers,
        cachedAt: new Date(cached.ts).toISOString(),
        hint: "to re-detect (e.g. after a VPN change), run: localStorage.removeItem('aiDoctorCountry')",
      });
      return;
    }

    // 2. Detect country code via IP, then map to emergency numbers.
    const code = await this.detectCountryCode();
    const map = await this.loadMap();
    const matched = !!(code && map[code]);
    const entry = (code && map[code]) || map.default;

    const resolved: CachedCountry = {
      countryCode: code,
      countryName: entry.name,
      emergencyNumbers: entry.emergency,
      ts: Date.now(),
    };
    this.apply(resolved);
    this.writeCache(resolved);
    console.log('[CountryService] resolved (fresh)', {
      detectedCode: code,
      matchedInJson: matched,
      usedEntry: matched ? code : 'default',
      countryName: entry.name,
      emergencyNumbers: entry.emergency,
    });
  }

  /**
   * Country names that read as "in **the** X" rather than "in X" — the United
   * States, the Netherlands, the Philippines, the Czech Republic, and so on.
   * Matches 19 of the 204 names in countries.json.
   */
  private static readonly NEEDS_ARTICLE =
    /\b(States|Kingdom|Republic|Emirates|Islands|Netherlands|Philippines|Bahamas|Gambia|Maldives|Comoros|Seychelles|Federation|Congo)\b/;

  /** " in India" / " in the United States" / "" when the country is unknown. */
  get inCountry(): string {
    const name = this.countryName;
    if (!name) return '';
    return CountryService.NEEDS_ARTICLE.test(name) ? ` in the ${name}` : ` in ${name}`;
  }

  /**
   * Emergency numbers as user-facing text, deduplicated and safe when the
   * country is unknown. Two problems this exists to solve:
   *
   *  - 84 of the 204 entries in countries.json use the SAME number for `all`
   *    and `ambulance` (US 911, UK 999, …). The old
   *    "call {{all}} or {{ambulance}}" markup rendered "call 911 or 911".
   *  - Before IP detection resolves — which includes every prerendered page,
   *    where detection never runs at all — the country is unknown but
   *    `emergencyNumbers` already holds the '112' environment fallback, so a
   *    visitor was told to dial a number that may not work where they are.
   */
  get emergencyNumbersText(): string {
    if (!this.countryName) return 'your local emergency services (112 / 911)';
    const { all, ambulance } = this.emergencyNumbers;
    if (!ambulance || ambulance === all) return all;
    return `${all} or ${ambulance} (ambulance)`;
  }

  /**
   * Complete, always-grammatical emergency sentence. Prefer this over stitching
   * `emergencyNumbers` into markup by hand — that is what produced "call 911 or
   * 911" in the first place.
   *
   *   unknown country → "In a medical emergency, call your local emergency
   *                      services (112 / 911) immediately."
   *   India           → "In a medical emergency in India, call 112 or 108
   *                      (ambulance) immediately."
   *   United States   → "In a medical emergency in the United States, call 911
   *                      immediately."
   */
  get emergencySentence(): string {
    return `In a medical emergency${this.inCountry}, call ${this.emergencyNumbersText} immediately.`;
  }

  private apply(c: CachedCountry): void {
    this.countryCode = c.countryCode;
    this.countryName = c.countryName;
    this.emergencyNumbers = c.emergencyNumbers || environment.emergencyNumbers;
  }

  // --- IP geolocation (free, keyless, CORS-enabled). geojs primary, ipwho fallback. ---
  private async detectCountryCode(): Promise<string | null> {
    try {
      const res: any = await firstValueFrom(
        this.http.get('https://get.geojs.io/v1/ip/country.json')
      );
      console.log('[CountryService] geojs.io response', res);
      const code = (res?.country || '').toUpperCase();
      if (code) return code;
    } catch (e) {
      console.warn('[CountryService] geojs.io failed, trying ipwho.is', e);
    }
    try {
      const res: any = await firstValueFrom(this.http.get('https://ipwho.is/'));
      console.log('[CountryService] ipwho.is response', res);
      const code = (res?.country_code || '').toUpperCase();
      if (code) return code;
    } catch (e) {
      console.warn('[CountryService] ipwho.is failed -> using default entry', e);
    }
    return null;
  }

  private async loadMap(): Promise<CountryMap> {
    if (this.map) return this.map;
    try {
      this.map = await firstValueFrom(this.http.get<CountryMap>(COUNTRIES_URL));
    } catch (_) {
      // JSON unreachable -> synthesize a default from environment.
      this.map = {
        default: { name: null, emergency: environment.emergencyNumbers },
      } as CountryMap;
    }
    return this.map;
  }

  private readCache(): CachedCountry | null {
    try {
      const raw = localStorage.getItem(LS_COUNTRY);
      if (!raw) return null;
      const c = JSON.parse(raw) as CachedCountry;
      if (!c?.emergencyNumbers || typeof c.ts !== 'number') return null;
      if (Date.now() - c.ts > CACHE_TTL_MS) return null;
      return c;
    } catch (_) {
      return null;
    }
  }

  private writeCache(c: CachedCountry): void {
    try {
      localStorage.setItem(LS_COUNTRY, JSON.stringify(c));
    } catch (_) {
      /* storage full / disabled -> in-memory only */
    }
  }
}
