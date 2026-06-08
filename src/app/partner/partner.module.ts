import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PartnerRoutingModule } from './partner-routing.module';
import { PartnerLoginComponent } from './pages/partner-login/partner-login.component';
import { PartnerSignupComponent } from './pages/partner-signup/partner-signup.component';
import { PartnerShellComponent } from './pages/partner-shell/partner-shell.component';
import { PartnerDashboardComponent } from './pages/partner-dashboard/partner-dashboard.component';
import { PartnerCampaignsComponent } from './pages/partner-campaigns/partner-campaigns.component';
import { PartnerLeadsComponent } from './pages/partner-leads/partner-leads.component';
import { PartnerOffersComponent } from './pages/partner-offers/partner-offers.component';

@NgModule({
  declarations: [
    PartnerLoginComponent,
    PartnerSignupComponent,
    PartnerShellComponent,
    PartnerDashboardComponent,
    PartnerCampaignsComponent,
    PartnerLeadsComponent,
    PartnerOffersComponent,
  ],
  imports: [CommonModule, FormsModule, PartnerRoutingModule],
})
export class PartnerModule {}
