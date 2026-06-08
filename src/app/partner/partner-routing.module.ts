import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartnerAuthGuard } from './guards/partner-auth.guard';
import { PartnerLoginComponent } from './pages/partner-login/partner-login.component';
import { PartnerSignupComponent } from './pages/partner-signup/partner-signup.component';
import { PartnerShellComponent } from './pages/partner-shell/partner-shell.component';
import { PartnerDashboardComponent } from './pages/partner-dashboard/partner-dashboard.component';
import { PartnerCampaignsComponent } from './pages/partner-campaigns/partner-campaigns.component';
import { PartnerLeadsComponent } from './pages/partner-leads/partner-leads.component';
import { PartnerOffersComponent } from './pages/partner-offers/partner-offers.component';

const routes: Routes = [
  { path: 'login', component: PartnerLoginComponent },
  { path: 'signup', component: PartnerSignupComponent },
  {
    path: '',
    component: PartnerShellComponent,
    canActivate: [PartnerAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PartnerDashboardComponent },
      { path: 'campaigns', component: PartnerCampaignsComponent },
      { path: 'leads', component: PartnerLeadsComponent },
      { path: 'offers', component: PartnerOffersComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PartnerRoutingModule {}
