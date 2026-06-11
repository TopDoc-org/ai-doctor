import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { PrivacyComponent } from './legal/privacy.component';
import { TermsComponent } from './legal/terms.component';
import { DisclaimerComponent } from './legal/disclaimer.component';
import { AiDoctorPageComponent } from './seo-pages/ai-doctor-page.component';
import { SymptomCheckerPageComponent } from './seo-pages/symptom-checker-page.component';
import { WhichSpecialistPageComponent } from './seo-pages/which-specialist-page.component';
import { HealthGuidePageComponent } from './seo-pages/health-guide-page.component';
import { EmergencyNumbersPageComponent } from './seo-pages/emergency-numbers-page.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    data: {
      seo: {
        // %COUNTRY% only in suffix positions — it collapses cleanly when unknown.
        title: 'AI Doctor & Free Symptom Checker in %COUNTRY% | DoctoGuide by KnocDoc',
        description:
          'Free AI doctor & symptom checker. Describe your symptoms, get instant AI health guidance, learn which specialist to see, and find trusted doctors near you in %COUNTRY%. No sign-up. DoctoGuide by KnocDoc.',
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
        title: 'Free AI Doctor Online — Ask Health Questions Instantly | DoctoGuide',
        description:
          'Talk to a free AI doctor online. Describe your symptoms, get instant health guidance, and learn which specialist to see. No sign-up, no card. DoctoGuide by KnocDoc.',
      },
    },
  },
  {
    path: 'symptom-checker',
    component: SymptomCheckerPageComponent,
    data: {
      seo: {
        title: 'Free AI Symptom Checker — Describe Symptoms, Get Guidance | DoctoGuide',
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
        title: 'Which Specialist Should I See? Find the Right Doctor | DoctoGuide',
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
        title: 'Free Online Health Guide — Symptoms, Reports & Medicines | DoctoGuide',
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
        title: 'Emergency Numbers by Country — Ambulance & Police | DoctoGuide',
        description:
          'Official emergency and ambulance phone numbers for over 190 countries, on one free page. Bookmark before you travel. DoctoGuide by KnocDoc.',
      },
    },
  },
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
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
