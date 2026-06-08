import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { PrivacyComponent } from './legal/privacy.component';
import { TermsComponent } from './legal/terms.component';
import { DisclaimerComponent } from './legal/disclaimer.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    data: {
      seo: {
        title: 'AI Doctor & Free Symptom Checker %COUNTRY% | DoctoGuide by KnocDoc',
        description:
          'Free AI doctor & symptom checker for %COUNTRY%. Describe your symptoms, get instant AI health guidance, learn which specialist to see, and find trusted doctors near you. No sign-up. DoctoGuide by KnocDoc.',
        keywords:
          'AI doctor %COUNTRY%, AI symptom checker, AI health assistant, AI diagnosis, AI health report, free online doctor %COUNTRY%, find doctor near me, AI health agent',
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
          'How DoctoGuide by KnocDoc collects, uses, and protects your health information. Privacy-first AI health assistant for %COUNTRY%.',
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
          'Terms of use for DoctoGuide by KnocDoc, the free AI health-information assistant and symptom checker for %COUNTRY%.',
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
          'DoctoGuide is an AI health-information assistant, not a licensed physician. Read the medical disclaimer. In an emergency in %COUNTRY% call 112 or 108.',
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
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
