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
        title: 'AI Doctor & Free Symptom Checker India | HealthGuide AI by KnocDoc',
        description:
          'Free AI doctor & symptom checker for India. Describe your symptoms, get instant AI health guidance, learn which specialist to see, and find trusted doctors near you. No sign-up. HealthGuide AI by KnocDoc.',
        keywords:
          'AI doctor India, AI symptom checker, AI health assistant, AI diagnosis, AI health report, free online doctor India, find doctor near me, AI health agent',
      },
    },
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: {
      seo: {
        title: 'Privacy Policy | HealthGuide AI by KnocDoc',
        description:
          'How HealthGuide AI by KnocDoc collects, uses, and protects your health information. Privacy-first AI health assistant for India.',
      },
    },
  },
  {
    path: 'terms',
    component: TermsComponent,
    data: {
      seo: {
        title: 'Terms of Use | HealthGuide AI by KnocDoc',
        description:
          'Terms of use for HealthGuide AI by KnocDoc, the free AI health-information assistant and symptom checker for India.',
      },
    },
  },
  {
    path: 'disclaimer',
    component: DisclaimerComponent,
    data: {
      seo: {
        title: 'Medical Disclaimer | HealthGuide AI by KnocDoc',
        description:
          'HealthGuide AI is an AI health-information assistant, not a licensed physician. Read the medical disclaimer. In an emergency in India call 112 or 108.',
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
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
