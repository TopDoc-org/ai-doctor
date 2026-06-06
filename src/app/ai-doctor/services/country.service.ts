import { Injectable } from '@angular/core';
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

  constructor(private http: HttpClient) {}

  // Idempotent: safe to call from multiple components; resolves once.
  init(): Promise<void> {
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
