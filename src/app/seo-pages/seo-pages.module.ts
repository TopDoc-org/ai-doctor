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
  ],
})
export class SeoPagesModule {}
