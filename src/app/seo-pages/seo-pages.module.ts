import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SeoPageLayoutComponent } from './seo-page-layout.component';
import { AiDoctorPageComponent } from './ai-doctor-page.component';
import { SymptomCheckerPageComponent } from './symptom-checker-page.component';
import { WhichSpecialistPageComponent } from './which-specialist-page.component';
import { HealthGuidePageComponent } from './health-guide-page.component';
import { EmergencyNumbersPageComponent } from './emergency-numbers-page.component';
import { HowItWorksPageComponent } from './how-it-works-page.component';
import { FindDoctorsPageComponent } from './find-doctors-page.component';
import { PricingPageComponent } from './pricing-page.component';
import { AboutPageComponent } from './about-page.component';
import { MedicalSafetyPageComponent } from './medical-safety-page.component';
import { ContactPageComponent } from './contact-page.component';
import { HealthTopicsIndexComponent } from './health-topics-index.component';
import { HealthTopicPageComponent } from './health-topic-page.component';
import { NotFoundComponent } from './not-found.component';

// Public SEO/content pages. Eagerly imported by AppModule — these routes are
// prerendered, so their components must be available without lazy loading.
@NgModule({
  declarations: [
    SeoPageLayoutComponent,
    AiDoctorPageComponent,
    SymptomCheckerPageComponent,
    WhichSpecialistPageComponent,
    HealthGuidePageComponent,
    EmergencyNumbersPageComponent,
    HowItWorksPageComponent,
    FindDoctorsPageComponent,
    PricingPageComponent,
    AboutPageComponent,
    MedicalSafetyPageComponent,
    ContactPageComponent,
    HealthTopicsIndexComponent,
    HealthTopicPageComponent,
    NotFoundComponent,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    AiDoctorPageComponent,
    SymptomCheckerPageComponent,
    WhichSpecialistPageComponent,
    HealthGuidePageComponent,
    EmergencyNumbersPageComponent,
    HowItWorksPageComponent,
    FindDoctorsPageComponent,
    PricingPageComponent,
    AboutPageComponent,
    MedicalSafetyPageComponent,
    ContactPageComponent,
    HealthTopicsIndexComponent,
    HealthTopicPageComponent,
    NotFoundComponent,
  ],
})
export class SeoPagesModule {}
