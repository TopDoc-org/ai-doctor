import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerAuthGuard } from './guards/owner-auth.guard';
import { OwnerLoginComponent } from './pages/owner-login/owner-login.component';
import { OwnerShellComponent } from './pages/owner-shell/owner-shell.component';
import { OwnerHomeComponent } from './pages/owner-home/owner-home.component';
import { OwnerCampaignsComponent } from './pages/owner-campaigns/owner-campaigns.component';
import { OwnerClinicsComponent } from './pages/owner-clinics/owner-clinics.component';

const routes: Routes = [
  { path: 'login', component: OwnerLoginComponent },
  {
    path: '',
    component: OwnerShellComponent,
    canActivate: [OwnerAuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: OwnerHomeComponent },
      { path: 'campaigns', component: OwnerCampaignsComponent },
      { path: 'clinics', component: OwnerClinicsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerRoutingModule {}
