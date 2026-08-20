import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { AdLandingComponent } from './landing/ad-landing.component';
import { PrivacyComponent } from './legal/privacy.component';
import { TermsComponent } from './legal/terms.component';
import { DisclaimerComponent } from './legal/disclaimer.component';
import { AiDoctorPageComponent } from './seo-pages/ai-doctor-page.component';
import { SymptomCheckerPageComponent } from './seo-pages/symptom-checker-page.component';
import { WhichSpecialistPageComponent } from './seo-pages/which-specialist-page.component';
import { HealthGuidePageComponent } from './seo-pages/health-guide-page.component';
import { EmergencyNumbersPageComponent } from './seo-pages/emergency-numbers-page.component';
import { HowItWorksPageComponent } from './seo-pages/how-it-works-page.component';
import { FindDoctorsPageComponent } from './seo-pages/find-doctors-page.component';
import { PricingPageComponent } from './seo-pages/pricing-page.component';
import { AboutPageComponent } from './seo-pages/about-page.component';
import { MedicalSafetyPageComponent } from './seo-pages/medical-safety-page.component';
import { ContactPageComponent } from './seo-pages/contact-page.component';
import { HealthTopicsIndexComponent } from './seo-pages/health-topics-index.component';
import { HealthTopicPageComponent } from './seo-pages/health-topic-page.component';
import { NotFoundComponent } from './seo-pages/not-found.component';
import { HEALTH_TOPICS } from './seo-pages/health-topics.data';

/**
 * One route per health topic, generated from the hand-written content list.
 * Static `data.seo` per route keeps SeoService as the single place metadata is
 * applied, and gives the prerenderer concrete URLs to walk. `topicSlug` tells the
 * shared component which entry to render.
 */
const healthTopicRoutes: Routes = HEALTH_TOPICS.map((topic) => ({
  path: `health-topics/${topic.slug}`,
  component: HealthTopicPageComponent,
  data: {
    topicSlug: topic.slug,
    seo: { title: topic.title, description: topic.description },
  },
}));

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    data: {
      seo: {
        // Brand first: the primary objective is ranking for the term "DoctoGuide".
        // No %COUNTRY% token here — the title is already at the 60-character limit,
        // and a token that expands at runtime would push it past truncation.
        title: 'DoctoGuide — AI Health Assistant & Symptom Checker | KnocDoc',
        description:
          'DoctoGuide is a free AI health assistant and symptom checker by KnocDoc. Describe your symptoms, understand possible explanations and urgency, and learn which specialist to see in %COUNTRY%. Informational guidance only — not medical advice.',
      },
    },
  },
  {
    // Paid-traffic landing page (Google Ads final URL). Kept OUT of the search
    // index so it never competes with `/` for the same queries, and out of
    // sitemap.xml (scripts/postbuild-seo.js). See ADS_COMPLIANCE_PLAN.md for why
    // its copy deliberately carries no personal-health vocabulary.
    path: 'start',
    component: AdLandingComponent,
    data: {
      seo: {
        title: 'DoctoGuide — Know Which Doctor to See | KnocDoc',
        // Directory framing, matching the page copy. No symptom vocabulary: this
        // string ships in <meta name="description"> and og:description on the ad
        // landing page. See ADS_COMPLIANCE_PLAN.md 3.3.
        description:
          'Free tool from KnocDoc. Tell it what you are looking for in plain language and narrow down which type of doctor to book with, then find doctors near you. No sign-up, no card.',
        robots: 'noindex,nofollow',
      },
    },
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: {
      seo: {
        title: 'Privacy Policy | DoctoGuide by KnocDoc',
        description:
          'How DoctoGuide by KnocDoc collects, uses, and protects your health information. Privacy-first AI health assistant.',
      },
    },
  },
  {
    path: 'terms',
    component: TermsComponent,
    data: {
      seo: {
        title: 'Terms of Use | DoctoGuide by KnocDoc',
        description:
          'Terms of use for DoctoGuide by KnocDoc, the free AI health-information assistant and symptom checker.',
      },
    },
  },
  {
    path: 'disclaimer',
    component: DisclaimerComponent,
    data: {
      seo: {
        title: 'Medical Disclaimer | DoctoGuide by KnocDoc',
        description:
          'DoctoGuide is an AI health-information assistant, not a licensed physician. Read the medical disclaimer. In an emergency, call your local emergency number.',
      },
    },
  },
  {
    path: 'ai-doctor',
    component: AiDoctorPageComponent,
    data: {
      seo: {
        title: 'Free AI Health Assistant Online | DoctoGuide by KnocDoc',
        description:
          'Ask a free AI health assistant online. Describe your symptoms, get instant informational guidance, and learn which specialist to see. Not a licensed physician and not medical advice. DoctoGuide by KnocDoc.',
      },
    },
  },
  {
    path: 'symptom-checker',
    component: SymptomCheckerPageComponent,
    data: {
      seo: {
        title: 'Free AI Symptom Checker — Instant Guidance | DoctoGuide',
        description:
          'Free AI symptom checker. Describe your symptoms in plain language and get instant guidance on what could be going on, how urgent it is, and which specialist to see.',
      },
    },
  },
  {
    path: 'which-specialist-to-see',
    component: WhichSpecialistPageComponent,
    data: {
      seo: {
        title: 'Which Specialist Should I See? | DoctoGuide',
        description:
          'Not sure which doctor to see? Match your symptoms to the right specialist with our free guide and AI assistant — avoid wasted consultations. DoctoGuide by KnocDoc.',
      },
    },
  },
  {
    path: 'health-guide',
    component: HealthGuidePageComponent,
    data: {
      seo: {
        title: 'Free Online Health Guide — Symptoms & Reports | DoctoGuide',
        description:
          'Your free online health guide. Understand symptoms, decode lab reports, and make sense of medicines in plain language. Better than Googling. DoctoGuide by KnocDoc.',
      },
    },
  },
  {
    path: 'emergency-numbers',
    component: EmergencyNumbersPageComponent,
    data: {
      seo: {
        title: 'Emergency Numbers by Country | DoctoGuide',
        description:
          'Official emergency and ambulance phone numbers for over 190 countries, on one free page. Bookmark before you travel. DoctoGuide by KnocDoc.',
      },
    },
  },
  {
    path: 'how-it-works',
    component: HowItWorksPageComponent,
    data: {
      seo: {
        title: 'How DoctoGuide Works — Symptoms to Specialist | DoctoGuide',
        description:
          'See exactly how DoctoGuide works: describe your symptoms, answer a few follow-ups, and get guidance, urgency, and the right specialist — free, no sign-up.',
      },
    },
  },
  {
    path: 'find-doctors',
    component: FindDoctorsPageComponent,
    data: {
      seo: {
        title: 'Find a Doctor Near You | DoctoGuide by KnocDoc',
        description:
          'Find doctors near you, matched to the specialist you actually need. Free doctor search from DoctoGuide, built for India. No sign-up, no listing fees.',
      },
    },
  },
  {
    path: 'pricing',
    component: PricingPageComponent,
    data: {
      seo: {
        title: 'DoctoGuide Pricing — Free, Always | DoctoGuide',
        description:
          'DoctoGuide is completely free: unlimited AI symptom checker, AI health assistant, specialist matching, and doctor search. No subscription, no card, no hidden tier.',
      },
    },
  },
  {
    path: 'about',
    component: AboutPageComponent,
    data: {
      seo: {
        title: 'About DoctoGuide — AI Health Assistant by KnocDoc',
        description:
          'DoctoGuide is a free AI health assistant and symptom checker built and operated by KnocDoc. What it does, why it exists, and what it deliberately will not do.',
      },
    },
  },
  {
    path: 'medical-safety',
    component: MedicalSafetyPageComponent,
    data: {
      seo: {
        title: 'Medical Safety & AI Limitations | DoctoGuide',
        description:
          'What DoctoGuide can and cannot do, how AI health guidance can be wrong, the warning signs that need emergency care, and how to use a symptom checker safely.',
      },
    },
  },
  {
    path: 'contact',
    component: ContactPageComponent,
    data: {
      seo: {
        title: 'Contact DoctoGuide by KnocDoc',
        description:
          'How to reach the team behind DoctoGuide, report a problem with the guidance, or ask about your data. Not a medical service — for emergencies call 112 or 108 in India.',
      },
    },
  },
  {
    path: 'health-topics',
    component: HealthTopicsIndexComponent,
    data: {
      seo: {
        title: 'Health Topics — Symptom Guides | DoctoGuide',
        description:
          'Plain-language guides to common symptoms: what causes them, the warning signs that need urgent care, and which specialist treats them. Free from DoctoGuide by KnocDoc.',
      },
    },
  },
  ...healthTopicRoutes,
  {
    path: 'triage',
    loadChildren: () =>
      import('./ai-doctor/ai-doctor.module').then((m) => m.AiDoctorModule),
    // Auth-gated app — keep out of the search index.
    data: { seo: { robots: 'noindex,nofollow' } },
  },
  {
    path: 'partner',
    loadChildren: () =>
      import('./partner/partner.module').then((m) => m.PartnerModule),
    // Clinic-admin dashboard — keep out of the search index.
    data: { seo: { robots: 'noindex,nofollow' } },
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
    // Global super-admin console — keep out of the search index.
    data: { seo: { robots: 'noindex,nofollow' } },
  },
  {
    path: 'owner',
    loadChildren: () =>
      import('./owner/owner.module').then((m) => m.OwnerModule),
    // Creator (platform-owner) console — keep out of the search index.
    data: { seo: { robots: 'noindex,nofollow' } },
  },
  // Real 404 instead of the previous `redirectTo: ''`. Redirecting every unknown
  // URL to the homepage returned HTTP 200 with duplicate homepage content for an
  // unlimited URL space — a soft 404. `/404` is prerendered and copied to
  // `404.html` at the output root so the host can serve it with a 404 status.
  {
    path: '404',
    component: NotFoundComponent,
    data: {
      seo: {
        title: 'Page Not Found | DoctoGuide',
        description: 'This page does not exist. Browse DoctoGuide, the free AI health assistant and symptom checker by KnocDoc.',
        robots: 'noindex,follow',
      },
    },
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: {
      seo: {
        title: 'Page Not Found | DoctoGuide',
        description: 'This page does not exist. Browse DoctoGuide, the free AI health assistant and symptom checker by KnocDoc.',
        robots: 'noindex,follow',
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
