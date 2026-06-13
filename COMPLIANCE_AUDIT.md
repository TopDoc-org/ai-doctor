# DoctoGuide (AIDoctorFront) — Medical-Legal Compliance Audit

**Date:** 12 June 2026
**Product:** DoctoGuide by KnocDoc — AI health-information assistant ("AI doctor" used for SEO only)
**Scope of this pass:** Frontend (Angular) content, claims, disclaimers, and legal pages.

---

## 1. Scope & Methodology

This audit covers only the **frontend** Angular application in this repository. It does
**not** cover the backend API, AI model behaviour, or data-storage infrastructure, which
are out of scope for this pass and are flagged where relevant.

**Jurisdiction:** India is treated as the **primary** jurisdiction. The relevant frameworks
considered are:

- **Digital Personal Data Protection Act, 2023 (DPDP Act)** — notice, consent, purpose
  limitation, children's data, grievance officer.
- **Information Technology (Reasonable Security Practices and Procedures and Sensitive
  Personal Data or Information) Rules, 2011 (SPDI Rules)** — sensitive personal data
  (health) handling.
- **ASCI Code (Advertising Standards Council of India)** — non-misleading advertising,
  substantiation of claims.
- **Telemedicine Practice Guidelines, 2020 (TPG 2020)** — referenced for positioning the
  service as "information only, not telemedicine".

Because the product serves 190+ countries via IP-based country detection, all **user-facing
language has been kept globally safe** (e.g. "call your local emergency number" when the
country is unknown), while legal pages are anchored to Indian law as primary.

**Method:** Manual review of all user-facing strings, claims, meta/SEO content, structured
data (JSON-LD), the triage chat flow, the consent gate, and the three legal pages
(Privacy, Terms, Disclaimer). Findings were verified by `grep`/file inspection against
specific `file:line` locations.

---

## 2. Findings

Status legend: **Fixed** · **Needs business input** · **Needs lawyer review** · **Accepted risk**

### 2.1 Positives — already compliant before this pass

| ID | Severity | Area | File:line | Finding | Status |
|----|----------|------|-----------|---------|--------|
| P-1 | — | Consent | triage-shell.component.ts `send()` / `showConsent` | Consent gate is shown **before** the first AI message is dispatched; no health processing happens without an explicit agree. | Fixed (pre-existing) |
| P-2 | — | Claims | privacy/terms/disclaimer + triage footer | No diagnosis, prescription, treatment, "accuracy", HIPAA, or FDA claims anywhere. "AI doctor" is always paired with "not a licensed physician / not a real doctor" framing. | Fixed (pre-existing) |
| P-3 | — | SEO/Indexing | app-routing.module.ts:119, :126, :133, :140 | Auth, clinic-admin, super-admin, and owner routes carry `robots: noindex,nofollow`. | Fixed (pre-existing) |
| P-4 | — | Safety | triage-shell `handleResponse()` `case 'emergency'` + emergency banner/card | Emergency detection routes the user to emergency services and locks the chat. | Fixed (pre-existing) |
| P-5 | — | Legal links | triage footer, legal-layout | Footer exposes Disclaimer / Privacy / Terms on every relevant surface. | Fixed (pre-existing) |

### 2.2 Issues fixed in this pass

| ID | Severity | Area | File:line | Finding | Status |
|----|----------|------|-----------|---------|--------|
| F-1 | Medium | Privacy notice completeness (DPDP) | privacy.component.ts §2 ("Information we collect") | Privacy policy did not disclose IP-based **approximate-country** detection via third-party geolocation services (geojs.io, ipwho.is). Disclosure sentence added. | Fixed |
| F-2 | High | Age eligibility | triage-shell.component.ts (`validateAge()`, `pickAgeSex()`, `confirmSelf()`, `submitDetails()`) + .html (age input row, consent label) | Terms claim 18+ but there was **no age validation**. Added an adults-only gate on the structured age input: ages < 18 are blocked with a globally-safe message and an under-18 DOB is never persisted to the profile. Added "I confirm I am 18 or older." to the consent label and `min="18"` to the age input. | Fixed |
| F-3 | High | Emergency fallback | environment.ts:10, environment.prod.ts:10 | Ambulance fallback was India-specific `'108'` for **all** countries when geolocation failed. Changed to GSM-standard `'112'` in both environments (matches the `default` entry in countries.json). | Fixed |
| F-4 | Medium | Emergency fallback (copy) | triage-shell.component.html (emergency banner, emergency card); terms.component.ts §4; disclaimer.component.ts "Emergencies" | When the country is unknown, hard-coded numbers were shown to everyone. Now branches on `countryName`: shows local numbers when known, "call your local emergency number" otherwise. | Fixed |
| F-5 | High | Misleading claim ("trusted") | index.html:10,:19,:51; manifest.webmanifest:4; app-routing.module.ts:22; core/seo.service.ts:31; landing.component.ts:41,:165; landing.component.html:81,:178,:208; which-specialist-page.component.ts:81,:125; symptom-checker-page.component.ts:34 | "**trusted doctors**" (9 source locations) contradicted Terms §5 / Disclaimer ("we do not verify or endorse practitioners"). Replaced with "doctors" / "doctors near you". Re-grep confirms **zero** remaining matches. | Fixed |
| F-6 | High | Misleading label ("recommendation") | triage-shell.component.html: "Our recommendation" badge, "Recommended partner clinic" header | Labels implied endorsement, contradicting Terms §5 ("we do not recommend any practitioner"). "Our recommendation" → "**Top rated nearby**"; "Recommended partner clinic" → "**Partner clinic**". | Fixed |
| F-7 | Medium | Doctor-listing disclaimer placement | triage-shell.component.html (results header, affiliate/partner block) | Listing-source disclaimer existed only at the **end** of the results list. Added a concise top disclaimer under the results header and in the partner/affiliate block: "Listings come from Google/OpenStreetMap. We don't verify or endorse practitioners — please check a doctor's registration before consulting." Existing bottom disclaimer retained. | Fixed |
| F-8 | Medium | Legal page wiring | privacy/terms/disclaimer.component.ts; legal-config.ts | All three legal pages were drafts with inline `[to be confirmed]` placeholders. Centralised every business fact in `legal-config.ts` and wired pages to read from it (`legal.*`). `updated` now uses `legal.lastUpdated` ('12 June 2026'). | Fixed |

### 2.3 Deliberately retained / accepted

| ID | Severity | Area | File:line | Finding | Status |
|----|----------|------|-----------|---------|--------|
| R-1 | — | Draft banner | legal-layout.component.ts:9-11; per-page "draft pending lawyer review" paragraphs | The "Draft — pending legal review" banner and per-page draft notes are **intentionally retained** until a qualified lawyer reviews the texts. Removing them now would overstate finality. | Accepted (by design) |
| R-2 | Low | Under-18 free-text bypass | triage-shell.component.ts (free-text chat path) | A user can still state an age < 18 in **free text** (not the structured input), which the frontend does not parse. Enforcing this reliably requires backend/AI handling. | Accepted risk (backend scope) |
| R-3 | Low | Health-guide puffery | landing copy, SEO pages | General aspirational/marketing language ("instant", "in seconds") is acceptable under the ASCI code as long as no specific medical-outcome claim is made; none is. | Accepted (ASCI) |

---

## 3. Required Business Inputs

The following must be supplied (exactly once) in **`src/app/legal/legal-config.ts`**. Every
legal page reads from this single file, so no other source change is needed once values are
filled. Until then the bracketed placeholders render verbatim.

| `legal-config.ts` field | What it needs | Used by |
|--------------------------|---------------|---------|
| `entityName` | Registered legal entity name | Privacy §1 |
| `entityAddress` | Registered address | Privacy §1 |
| `hostingLocation` | Where data is hosted / stored | Privacy §6 |
| `retentionPeriods` | Specific data-retention periods | Privacy §7 |
| `privacyEmail` | Privacy / data-rights contact email | Privacy §8 |
| `grievanceOfficerName` | Grievance Officer name (DPDP / IT Rules) | Privacy §10, Terms §10 |
| `grievanceOfficerEmail` | Grievance Officer email | Privacy §10, Terms §10 |
| `grievanceResponseTime` | Grievance response timeline | Privacy §10 |
| `jurisdictionCity` | Governing-law jurisdiction city | Terms §10 |
| `lastUpdated` | Effective date (currently '12 June 2026') | All three legal pages |

---

## 4. Lawyer-Review Items

The following require review by a qualified Indian healthcare / privacy lawyer before the
draft banners can be removed:

1. **All three legal texts** — Privacy Policy, Terms of Use, Medical Disclaimer (full
   substantive review).
2. **Consent wording** — the in-app consent label (Terms agreement + 18+ confirmation +
   health-data processing notice) and whether it meets DPDP "free, specific, informed,
   unambiguous" consent.
3. **Liability / warranty enforceability** — the "as is" disclaimer and limitation-of-
   liability clauses (Terms §8, Disclaimer "No warranty").
4. **DPDP children's-data position** — the adults-only stance vs. DPDP requirements for
   processing children's data, and whether the current frontend age gate + accepted free-
   text bypass (R-2) is defensible.
5. **TPG 2020 positioning** — confirm the "information-only, **not** telemedicine" framing
   holds, so the service is not treated as teleconsultation under the Telemedicine Practice
   Guidelines, 2020.

---

## 5. Deliberately Unchanged

The following were intentionally **not** modified in this pass:

- **Draft / "pending legal review" banner** and per-page draft notes (see R-1) — retained
  for honesty until lawyer review.
- **Consent flow** — single checkbox, single gate, no flow change (only label text added).
- **Backend** — no API, model, or data-storage changes; backend enforcement of age and of
  data handling is out of scope here.
- **`country.service.ts` and `countries.json`** — country-detection logic and the country
  data table were left untouched; only the environment-level fallback number and the copy
  branching changed.
